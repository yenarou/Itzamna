from __future__ import annotations

from app.schemas.info import BodyInfo, InfoField

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


def pick_zone_profile(planet: str, zone_filters: dict[str, str]) -> dict:
    profiles = ZONE_PROFILES.get(planet, ZONE_PROFILES["marte"])
    wanted = zone_filters.get("zona")
    if wanted and wanted in profiles:
        return profiles[wanted]
    best = None
    best_score = -1
    for profile in profiles.values():
        s = sum(1 for k, v in zone_filters.items() if profile["tags"].get(k) == v)
        if s > best_score:
            best_score = s
            best = profile
    return best or next(iter(profiles.values()))


def build_zone_body(profile: dict, zone_filters: dict[str, str] | None = None) -> BodyInfo:
    zone_filters = zone_filters or {}
    keys = ["composicion", "temperatura", "relieve", "zona"]
    vals = []
    for k in keys:
        if k in zone_filters:
            vals.append(92 if profile["tags"].get(k) == zone_filters[k] else 35)
        else:
            base = 80 if k == "temperatura" else 78
            vals.append(base)
    corrs = [vals[0], vals[1], int(round((vals[2] + vals[3]) / 2)), 74]
    fields = [InfoField(label=l, value=v, detail=d, correlation=corrs[i] if i < len(corrs) else None) for i, (l, v, d) in enumerate(profile["fields"])]
    return BodyInfo(kicker=profile["kicker"], title=profile["title"], tone=TONE[profile["tone"]], imageUrl=profile["imageUrl"], fields=fields)
