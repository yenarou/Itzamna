from __future__ import annotations

import hashlib
import json
import math
import urllib.parse
import urllib.request
from math import asin, atan2, cos, degrees, radians, sin, sqrt

from app.schemas.search import BodyInfo, InfoField, Match, SearchQuery

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

# Perfiles de zonas objetivo (Luna/Marte) - no son lugares terrestres preestablecidos
ZONE_PROFILES = {
    "luna": {
        "mares": {
            "title": "Mares lunares (basálticos)",
            "kicker": "Luna · Mares",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~medium.jpg",
            "tags": {"zona": "mares", "temperatura": "extrema", "composicion": "basalto", "relieve": "plano"},
            "fields": [
                ("Litología/regolito", "Basaltos toleíticos ricos en FeO/TiO₂ (mare basalts)", "Llanuras volcánicas que rellenaron cuencas de impacto; análogos terrestres frecuentes: flujos basálticos y campos volcánicos máficos (p. ej. provincias basálticas)."),
                ("Condiciones térmicas", "≈ −173 °C a +127 °C (superficie, ciclo día/noche)", "Sin atmósfera significativa ni moderación térmica; alta amplitud térmica y radiación solar directa. Relevante para pruebas térmicas y de materiales."),
                ("Morfología", "Planicies de baja pendiente con cráteres superpuestos", "Topografía favorable para movilidad/aterrizaje relativo; presencia de regolito fino y bloques ejectados."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, alta radiación", "Regolito abrasivo y electrostático; referencia: misiones Apollo/LRO. El análogo evalúa similitud geológica/geomorfológica, no gravedad ni vacío."),
            ],
        },
        "crateres": {
            "title": "Cráteres de impacto",
            "kicker": "Luna · Cráteres",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA23210/PIA23210~medium.jpg",
            "tags": {"zona": "crateres", "temperatura": "extrema", "composicion": "regolito", "relieve": "crateres"},
            "fields": [
                ("Litología/regolito", "Regolito impactado, brechas y ejecta", "Mezcla de fragmentos por gardenado de impactos; análogos: cráteres de impacto terrestres y terrenos de ejecta."),
                ("Condiciones térmicas", "Gradientes extremos iluminado/sombra", "Paredes y fondos con insolación contrastada; microambientes fríos persistentes en sombras locales."),
                ("Morfología", "Rim, paredes, fondo y manto de eyecta", "Geometría de impacto (simple/complejo según escala) útil para navegación, muestreo estratigráfico y habitabilidad de sombra."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, alta radiación", "Procesos dominados por impactos y meteorización espacial; analogía centrada en forma/depósitos, no en atmósfera."),
            ],
        },
        "polos": {
            "title": "Regiones polares en sombra permanente",
            "kicker": "Luna · Polos",
            "tone": "moonPole",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA14021/PIA14021~medium.jpg",
            "tags": {"zona": "polos", "temperatura": "muy-fria", "composicion": "hielo", "relieve": "crateres"},
            "fields": [
                ("Volátiles/comp.", "Hielo de agua y volátiles fríos en PSR (evidencia remota)", "Depósitos potenciales en regolito frío; análogos: ambientes polares/fríos terrestres y permafrost (con diferencias de presión)."),
                ("Condiciones térmicas", "< −200 °C en sombras permanentes (PSR)", "Trampas frías estables; relevancia para ISRU y preservación de volátiles."),
                ("Morfología", "Cráteres profundos y cuencas de alta latitud", "Iluminación rasante y topografía que genera sombras persistentes."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, radiación", "Referencia: LCROSS/LRO/Diviner. La analogía terrestre es parcial (presencia de atmósfera e hidrosfera en la Tierra)."),
            ],
        },
    },
    "marte": {
        "planicies": {
            "title": "Planicies marcianas",
            "kicker": "Marte · Planicies",
            "tone": "rust",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA05112/PIA05112~medium.jpg",
            "tags": {"zona": "planicies", "temperatura": "fria", "composicion": "sulfatos", "relieve": "plano"},
            "fields": [
                ("Litología/mineralogía", "Sulfatos, óxidos férricos y basaltos alterados", "Señales de interacción agua-roca en el pasado; análogos: desiertos, evaporitas y terrenos volcánicos áridos."),
                ("Condiciones térmicas", "≈ −90 °C a 0 °C (variable por latitud/estación)", "Atmósfera tenue (~6 mbar CO₂) con gran amplitud diaria; polvo en suspensión frecuente."),
                ("Morfología", "Planicies extensas, cráteres, dunas", "Superficies de tránsito y operación; relevante para rovers y logística de campo."),
                ("Entorno planetario", "g ≈ 0.38 g, P baja, radiación UV/iónica", "Referencia: MER/MSL/Mars Reconnaissance Orbiter. Analogía terrestre no replica presión/gravedad/radiación."),
            ],
        },
        "canones": {
            "title": "Cañones y valles",
            "kicker": "Marte · Cañones",
            "tone": "rust",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA00422/PIA00422~medium.jpg",
            "tags": {"zona": "canones", "temperatura": "fria", "composicion": "oxidos", "relieve": "montanoso"},
            "fields": [
                ("Litología/estratigrafía", "Secuencias estratificadas, óxidos de Fe, minerales hidratados", "Afloramientos que registran historia geológica/hídrica; análogos: cañones y valles erosivos terrestres."),
                ("Condiciones térmicas", "≈ −110 °C a 0 °C; microclimas en fondo", "Mayor presión relativa en cotas bajas; gradientes topográficos marcados."),
                ("Morfología", "Escarpes, taludes, redes de valles", "Terreno accidentado, útil para estudio estratigráfico y desafíos de movilidad."),
                ("Entorno planetario", "g ≈ 0.38 g, atmósfera tenue, radiación", "Procesos dominados por erosión, deslizamientos y meteorización; analogía enfocada en relieve/procesos."),
            ],
        },
        "polos": {
            "title": "Casquetes polares",
            "kicker": "Marte · Casquetes polares",
            "tone": "ice",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA13163/PIA13163~medium.jpg",
            "tags": {"zona": "polos", "temperatura": "muy-fria", "composicion": "hielo-agua", "relieve": "plano"},
            "fields": [
                ("Volátiles/comp.", "H₂O hielo, CO₂ estacional, capas de polvo", "Estratigrafía de hielos y depósitos laminados; análogos: glaciares, casquetes y regiones polares terrestres."),
                ("Condiciones térmicas", "Hasta ~ −125 °C en invierno polar", "Condensación/sublimación de CO₂ estacional; albedo y procesos criogénicos activos."),
                ("Morfología", "Mesetas heladas, troughs y patrones eólicos", "Terrenos de hielo con dinámica estacional; interés para clima e ISRU."),
                ("Entorno planetario", "g ≈ 0.38 g, atmósfera tenue, radiación", "Referencia: Mars Polar Lander/MRO/HiRISE. Analogía parcial por diferencias atmosféricas y de presión de vapor."),
            ],
        },
    },
}



OSM_HEADERS = {
    "User-Agent": "ItzamnaHackathon/1.0 (analog search; contact: local-demo)",
    "Accept": "application/json",
}


def _http_json(url: str, timeout: float = 3.0):
    try:
        req = urllib.request.Request(url, headers=OSM_HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", "ignore"))
    except Exception:
        return None


def reverse_geocode_name(lat: float, lon: float) -> str | None:
    q = urllib.parse.urlencode({"format": "jsonv2", "lat": f"{lat:.6f}", "lon": f"{lon:.6f}", "zoom": 10, "addressdetails": 1})
    data = _http_json(f"https://nominatim.openstreetmap.org/reverse?{q}", timeout=3.5)
    if not data:
        return None
    addr = data.get("address") or {}
    for k in ("natural", "peak", "volcano", "desert", "valley", "village", "hamlet", "town", "city", "municipality", "county", "state", "region"):
        if addr.get(k):
            name = str(addr[k])
            state = addr.get("state") or addr.get("region")
            if state and state != name:
                return f"{name}, {state}"
            return name
    name = data.get("name") or (str(data.get("display_name", "")).split(",")[0].strip() or None)
    return name


def route_from_user(user_lat: float, user_lon: float, lat: float, lon: float) -> tuple[float | None, float | None]:
    # OSRM espera lon,lat
    coords = f"{user_lon:.6f},{user_lat:.6f};{lon:.6f},{lat:.6f}"
    url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=false&alternatives=false"
    data = _http_json(url, timeout=3.5)
    try:
        route = data["routes"][0]
        return (float(route["distance"]) / 1000.0, float(route["duration"]) / 60.0)
    except Exception:
        return (None, None)


def human_interference(lat: float, lon: float) -> tuple[str, bool, int]:
    # Proxy de interferencia humana: edificios y vías cercanas (Overpass). Best-effort.
    radius = 1200
    query = f'[out:json][timeout:5];(way["building"](around:{radius},{lat},{lon});way["highway"](around:{radius},{lat},{lon});node["place"](around:{radius},{lat},{lon}););out count;'
    url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
    data = _http_json(url, timeout=6.0)
    count = 0
    try:
        elements = data.get("elements") or []
        # formatos posibles de count
        if elements and "tags" in elements[0]:
            tags = elements[0].get("tags") or {}
            count = int(tags.get("total") or tags.get("ways") or tags.get("nodes") or 0)
            # si solo viene parcial, suma
            if count == 0:
                count = int(tags.get("ways", 0)) + int(tags.get("nodes", 0))
        elif elements:
            count = len(elements)
    except Exception:
        count = 0
    if count == 0:
        # si Overpass no respondió o no hay datos, asumimos baja interferencia en zona muestreada
        return ("baja", True, 0)
    if count <= 5:
        return ("baja", True, count)
    if count <= 40:
        return ("media", False, count)
    return ("alta", False, count)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def dest_point(lat: float, lon: float, bearing_deg: float, dist_km: float) -> tuple[float, float]:
    r = 6371.0
    br = radians(bearing_deg)
    lat1 = radians(lat)
    lon1 = radians(lon)
    d = dist_km / r
    lat2 = asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(br))
    lon2 = lon1 + atan2(sin(br) * sin(d) * cos(lat1), cos(d) - sin(lat1) * sin(lat2))
    return (degrees(lat2), (degrees(lon2) + 540) % 360 - 180)


def min_compat_for_radius(radius_km: float) -> int:
    if radius_km <= 1:
        return 65
    if radius_km <= 10:
        return 55
    if radius_km <= 50:
        return 40
    return 25


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def infer_earth_profile(lat: float, lon: float, earth_filters: dict[str, str]) -> dict[str, str]:
    # Inferencia heurística en tiempo real a partir de coordenadas + filtros del usuario
    al = abs(lat)
    tags: dict[str, str] = {}
    if "clima" in earth_filters:
        tags["clima"] = earth_filters["clima"]
    else:
        if al >= 66:
            tags["clima"] = "polar"
        elif al <= 23:
            tags["clima"] = "arido"
        else:
            tags["clima"] = "templado"

    if "altitud" in earth_filters:
        tags["altitud"] = earth_filters["altitud"]
    else:
        # proxy simple por regiones conocidas aproximadas (no catálogo de lugares, solo heurística)
        tags["altitud"] = "media" if al > 15 else "baja"

    if "humedad" in earth_filters:
        tags["humedad"] = earth_filters["humedad"]
    else:
        tags["humedad"] = "muy-baja" if tags["clima"] == "arido" else ("baja" if tags["clima"] == "polar" else "media")

    if "suelo" in earth_filters:
        tags["suelo"] = earth_filters["suelo"]
    else:
        if tags["clima"] == "polar":
            tags["suelo"] = "hielo"
        elif tags["clima"] == "arido":
            tags["suelo"] = "salino"
        else:
            tags["suelo"] = "arenoso"
    return tags



def score_match(earth_tags: dict[str, str], zone_tags: dict[str, str], earth_filters: dict[str, str], zone_filters: dict[str, str], dist_km: float | None, radius_km: float | None, from_user_km: float | None = None, route_km: float | None = None, interference: str | None = None, prefer_isolated: bool = True, prefer_accessible: bool = True) -> int:
    items: list[tuple[bool, bool]] = []
    for k in ("clima", "altitud", "suelo", "humedad"):
        if k in earth_filters:
            items.append((earth_tags.get(k) == earth_filters[k], True))
        elif k in earth_tags:
            items.append((True, False))
    for k in ("zona", "temperatura", "composicion", "relieve"):
        if k in zone_filters:
            items.append((zone_tags.get(k) == zone_filters[k], True))
        elif k in zone_tags:
            items.append((True, False))

    if not items:
        base = 58.0
    else:
        specified = [m for m, s in items if s]
        base = 100.0 * (sum(1 for m in specified if m) / len(specified)) if specified else 62.0
    if dist_km is not None and radius_km:
        base -= 8.0 * (dist_km / max(radius_km, 1e-6))

    # Factor de accesibilidad/interferencia humana y aislamiento
    if prefer_isolated:
        if interference == "baja":
            base += 6.0
        elif interference == "media":
            base += 0.0
        elif interference == "alta":
            base -= 8.0
    if prefer_accessible and from_user_km is not None:
        # accesible pero no "justo al lado": muy cerca penaliza, muy lejos penaliza leve
        if from_user_km < 1.5:
            base -= 18.0
        elif from_user_km < 5.0:
            base -= 4.0
        if route_km is not None:
            if route_km <= 200:
                base += 3.0
            elif route_km > 1500:
                base -= 4.0
        # sin ruta calculable no penaliza fuerte (puede ser zona remota pero válida)

    return int(round(clamp(base, 15, 75)))


def pick_zone_profile(planet: str, zone_filters: dict[str, str]) -> dict:
    profiles = ZONE_PROFILES.get(planet, ZONE_PROFILES["marte"])
    wanted = zone_filters.get("zona")
    if wanted and wanted in profiles:
        return profiles[wanted]
    best = None
    best_score = -1
    for p in profiles.values():
        s = sum(1 for k, v in zone_filters.items() if p["tags"].get(k) == v)
        if s > best_score:
            best_score = s
            best = p
    return best or next(iter(profiles.values()))


def build_earth_body(lat: float, lon: float, tags: dict[str, str], idx: int, place_name: str | None = None, from_user_km: float | None = None, route_km: float | None = None, route_min: float | None = None, interference: str | None = None, isolated: bool | None = None, interference_count: int | None = None, radius_km: float | None = None, dist_km: float | None = None) -> BodyInfo:
    labels = {
        "clima": {"arido": "Árido (BW/BS, Köppen aprox.)", "polar": "Polar/frío (E, Köppen aprox.)", "templado": "Templado (C, Köppen aprox.)"},
        "altitud": {"baja": "Baja (< 500 m s. n. m.)", "media": "Media (500–2000 m s. n. m.)", "alta": "Alta (> 2000 m s. n. m.)"},
        "suelo": {"basaltico": "Basáltico/ígneo máfico", "arenoso": "Arenoso/sedimentario clástico", "ferroso": "Rico en óxidos de Fe", "salino": "Salino/evaporítico", "hielo": "Hielo y permafrost (criósfera)"},
        "humedad": {"muy-baja": "Muy baja (hiperárida)", "baja": "Baja (árida-semiárida)", "media": "Media (subhúmeda)"},
    }
    def lab(k: str) -> str:
        v = tags.get(k, "n/d")
        return labels.get(k, {}).get(v, v)

    tone_key = "ice" if tags.get("clima") == "polar" else ("salt" if tags.get("clima") == "arido" else "basalt")
    title = place_name or f"Candidato en {lat:.3f}°, {lon:.3f}°"
    fields = [
        InfoField(label="Toponimia (OSM)", value=place_name or "Sin toponimia resoluble", detail="Nombre/topónimo aproximado por geocodificación inversa (Nominatim/OpenStreetMap) del punto muestreado. Puede corresponder a un accidente geográfico, unidad administrativa o área próxima."),
        InfoField(label="Georreferenciación", value=f"{lat:.5f}°, {lon:.5f}° (WGS84)", detail="Coordenadas geodésicas decimales del candidato generado dentro del área de búsqueda. Punto calculado algorítmicamente (no un sitio preestablecido)."),
    ]
    if radius_km is not None and dist_km is not None:
        fields.append(InfoField(label="Muestreo espacial", value=f"{dist_km:.2f} km del centro · radio {radius_km:.0f} km", detail="Candidato obtenido por muestreo radial dentro del radio solicitado; se evalúa similitud respecto al perfil de la zona objetivo y filtros del usuario."))
    if from_user_km is not None:
        ruta = f"{route_km:.1f} km, ~{route_min:.0f} min (perfil conducción, OSRM)" if route_km is not None and route_min is not None else "sin ruta vehicular calculable (OSRM); se reporta distancia geodésica"
        fields.append(InfoField(label="Accesibilidad (desde tu ubicación)", value=f"{from_user_km:.1f} km geodésicos", detail=f"Ruta estimada: {ruta}. Criterio: accesible pero no inmediato al observador (se penalizan distancias muy cortas) para representar sitios visitables y no triviales."))
    if interference is not None:
        iso_txt = "aislada (baja huella antrópica local)" if isolated else "no plenamente aislada"
        ctxt = f", n≈{interference_count} elementos viales/edificados en ~1.2 km (Overpass)" if interference_count is not None else ""
        fields.append(InfoField(label="Interferencia humana", value=f"{interference.capitalize()} · {iso_txt}", detail=f"Proxy de antropización derivado de infraestructura mapeada en OpenStreetMap{ctxt}. Menor interferencia favorece condiciones análogas más prístinas; es un indicador indirecto, no una medición ambiental in situ."))
    fields.extend([
        InfoField(label="Clima inferido (proxy)", value=lab("clima"), detail="Clase climática estimada heurísticamente desde latitud y filtros (proxy de insolación/temperatura media). No sustituye observaciones meteorológicas ni reanálisis (p. ej. NASA POWER/MERRA-2)."),
        InfoField(label="Altitud estimada", value=lab("altitud"), detail="Rango altimétrico aproximado inferido para la consulta. Requiere validación con DEM (SRTM/ASTER/GLO-30) para uso científico riguroso."),
        InfoField(label="Sustrato y humedad (proxy)", value=f"{lab('suelo')} · {lab('humedad')}", detail="Atributos de superficie inferidos de forma cualitativa para el modelo de similitud. La caracterización real requiere geología de campo/teledetección y datos edáficos/hídricos."),
        InfoField(label="Metodología de similitud", value=f"Índice normalizado 0–100, acotado a ≤75%", detail="Puntaje basado en concordancia de criterios ambientales (Tierra) y morfológico-composicionales (zona objetivo), con ajuste por distancia, accesibilidad e interferencia humana. Umbrales mínimos por radio: 1 km ≥65%, 10 km ≥55%, 50 km ≥40%, ≥100 km ≥25% (propuesta Itzamná). Resultado orientativo, no determinístico."),
    ])
    # Imagen satelital del punto marcado (Esri World Imagery)
    d = 0.08
    minLon, minLat, maxLon, maxLat = lon-d, lat-d/1.6, lon+d, lat+d/1.6
    image_url = f"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox={minLon:.6f},{minLat:.6f},{maxLon:.6f},{maxLat:.6f}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image"
    return BodyInfo(
        kicker=f"Tierra · Candidato calculado #{idx}",
        title=title,
        tone=TONE[tone_key],
        imageUrl=image_url,
        fields=fields,
    )


def build_zone_body(profile: dict) -> BodyInfo:
    return BodyInfo(
        kicker=profile["kicker"],
        title=profile["title"],
        tone=TONE[profile["tone"]],
        imageUrl=profile["imageUrl"],
        fields=[InfoField(label=l, value=v, detail=d) for l, v, d in profile["fields"]],
    )


def generate_candidates(center_lat: float, center_lon: float, radius_km: float, count: int) -> list[tuple[float, float, float]]:
    pts: list[tuple[float, float, float]] = [(center_lat, center_lon, 0.0)]
    if count <= 1:
        return pts
    rings = 2
    for ring in range(1, rings + 1):
        n = max(3, (count - 1) * ring // ((rings * (rings + 1)) // 2))
        dist = radius_km * ring / rings
        for k in range(n):
            if len(pts) >= count:
                break
            bearing = (360.0 * k / n) + (ring * 17)
            lat, lon = dest_point(center_lat, center_lon, bearing, dist * 0.98)
            d = haversine_km(center_lat, center_lon, lat, lon)
            if d <= radius_km:
                pts.append((lat, lon, d))
    while len(pts) < count:
        b = (len(pts) * 57) % 360
        lat, lon = dest_point(center_lat, center_lon, b, radius_km * 0.5)
        pts.append((lat, lon, haversine_km(center_lat, center_lon, lat, lon)))
    return pts[:count]


def search_analogs(query: SearchQuery) -> list[Match]:
    planet = query.planet if query.planet in ZONE_PROFILES else "marte"
    zone_filters = dict(query.zone or {})
    earth_filters = dict(query.earth or {})
    profile = pick_zone_profile(planet, zone_filters)
    prefer_isolated = bool(getattr(query, "preferIsolated", True))
    prefer_accessible = bool(getattr(query, "preferAccessible", True))
    user_loc = getattr(query, "userLocation", None)

    if query.location is not None:
        center_lat = float(query.location.lat)
        center_lon = float(query.location.lng)
        radius_km = float(query.location.radiusKm)
    else:
        seed = hashlib.sha1(f"{planet}|{sorted(earth_filters.items())}|{sorted(zone_filters.items())}".encode()).hexdigest()
        center_lat = (int(seed[:4], 16) / 65535.0) * 140 - 70
        center_lon = (int(seed[4:8], 16) / 65535.0) * 360 - 180
        radius_km = 50.0

    # Si hay ubicación del usuario, evitamos sugerir justo encima de ella
    min_from_user_km = 1.5 if user_loc is not None else 0.0

    candidates = generate_candidates(center_lat, center_lon, radius_km, 8)
    results: list[Match] = []
    zone_body = build_zone_body(profile)

    for i, (lat, lon, dist) in enumerate(candidates, start=1):
        from_user_km = None
        route_km = None
        route_min = None
        if user_loc is not None:
            from_user_km = haversine_km(float(user_loc.lat), float(user_loc.lng), lat, lon)
            if from_user_km < min_from_user_km:
                continue
        earth_tags = infer_earth_profile(lat, lon, earth_filters)

        # Enriquecimiento con OpenStreetMap: nombre, ruta y factor de interferencia humana
        place_name = reverse_geocode_name(lat, lon)
        if user_loc is not None and prefer_accessible:
            route_km, route_min = route_from_user(float(user_loc.lat), float(user_loc.lng), lat, lon)
        interference, isolated, interference_count = human_interference(lat, lon)

        pct = score_match(
            earth_tags, profile["tags"], earth_filters, zone_filters,
            dist if query.location else None, radius_km if query.location else None,
            from_user_km, route_km, interference, prefer_isolated, prefer_accessible,
        )
        if query.location is not None and pct < min_compat_for_radius(radius_km):
            continue

        earth_body = build_earth_body(lat, lon, earth_tags, len(results) + 1, place_name, from_user_km, route_km, route_min, interference, isolated, interference_count, radius_km if query.location else None, dist if query.location else None)
        results.append(
            Match(
                id=f"calc-{planet}-{len(results)+1}-{abs(hash((round(lat,4), round(lon,4), planet)))%100000}",
                percentage=pct,
                earth=earth_body,
                zone=zone_body,
                distanceKm=round(dist, 2) if query.location is not None else None,
                fromUserKm=round(from_user_km, 2) if from_user_km is not None else None,
                routeKm=round(route_km, 2) if route_km is not None else None,
                routeMin=round(route_min, 1) if route_min is not None else None,
                placeName=place_name,
                humanInterference=interference,
                isolated=isolated,
            )
        )
        if len(results) >= 6:
            break

    if not results:
        # relaja: permite cercanos si todo fue filtrado
        lat, lon, dist = candidates[0]
        from_user_km = haversine_km(float(user_loc.lat), float(user_loc.lng), lat, lon) if user_loc is not None else None
        earth_tags = infer_earth_profile(lat, lon, earth_filters)
        place_name = reverse_geocode_name(lat, lon)
        route_km = route_min = None
        if user_loc is not None and prefer_accessible:
            route_km, route_min = route_from_user(float(user_loc.lat), float(user_loc.lng), lat, lon)
        interference, isolated, interference_count = human_interference(lat, lon)
        pct = max(15, min_compat_for_radius(radius_km) if query.location else 30)
        earth_body = build_earth_body(lat, lon, earth_tags, 1, place_name, from_user_km, route_km, route_min, interference, isolated, interference_count, radius_km if query.location else None, dist if query.location else None)
        results.append(
            Match(
                id=f"calc-{planet}-best",
                percentage=int(pct),
                earth=earth_body,
                zone=zone_body,
                distanceKm=round(dist, 2) if query.location is not None else None,
                fromUserKm=round(from_user_km, 2) if from_user_km is not None else None,
                routeKm=round(route_km, 2) if route_km is not None else None,
                routeMin=round(route_min, 1) if route_min is not None else None,
                placeName=place_name,
                humanInterference=interference,
                isolated=isolated,
            )
        )

    results.sort(key=lambda m: m.percentage, reverse=True)
    return results
