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
    "moon": {
        "maria": {
            "title": "Lunar maria (basaltic)",
            "kicker": "Moon · Maria",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~orig.jpg",
            "tags": {"zone": "maria", "temperature": "extreme", "composition": "basalt", "terrain": "flat"},
            "fields": [
                ("Lithology/regolith", "Tholeiitic basalts rich in FeO/TiO₂ (mare basalts)", "Volcanic plains that filled impact basins; terrestrial analogs include basalt flows and mafic volcanic fields."),
                ("Thermal conditions", "≈ −173 °C to +127 °C (surface, day/night cycle)", "No significant atmosphere; large thermal range and direct solar radiation."),
                ("Morphology", "Low-slope plains with superimposed craters", "Topography favorable for relative mobility; fine regolith and ejected blocks."),
                ("Planetary environment", "Vacuum, g ≈ 0.165 g, high radiation", "Reference: Apollo/LRO. Geological/geomorphological analogy, not gravity or vacuum."),
            ],
        },
        "craters": {
            "title": "Impact craters",
            "kicker": "Moon · Craters",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA23210/PIA23210~orig.jpg",
            "tags": {"zone": "craters", "temperature": "extreme", "composition": "regolith", "terrain": "craters"},
            "fields": [
                ("Lithology/regolith", "Impact-regolith, breccias, and ejecta", "Impact-generated fragment mixture; analogs include terrestrial impact craters and ejecta terrain."),
                ("Thermal conditions", "Extreme sunlit/shadow gradients", "Contrasting insolation on walls and floors, with cold microenvironments in local shadows."),
                ("Morphology", "Rim, walls, floor, and ejecta blanket", "Impact geometry useful for navigation and stratigraphic sampling."),
                ("Planetary environment", "Vacuum, g ≈ 0.165 g, high radiation", "Processes dominated by impacts and space weathering."),
            ],
        },
        "poles": {
            "title": "Permanently shadowed polar regions",
            "kicker": "Moon · Poles",
            "tone": "moonPole",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg",
            "tags": {"zone": "poles", "temperature": "very-cold", "composition": "ice", "terrain": "craters"},
            "fields": [
                ("Volatiles/composition", "Water ice and cold volatiles in PSRs (remote evidence)", "Potential deposits in cold regolith; analogs include terrestrial polar, cold, and permafrost environments (with pressure differences)."),
                ("Thermal conditions", "< −200 °C in permanently shadowed regions (PSRs)", "Stable cold traps; relevant to ISRU and volatile preservation."),
                ("Morphology", "Deep craters and high-latitude basins", "Low-angle illumination and topography create persistent shadows."),
                ("Planetary environment", "Vacuum, g ≈ 0.165 g, radiation", "Reference: LCROSS/LRO/Diviner. Partial terrestrial analogy."),
            ],
        },
    },
    "mars": {
        "plains": {
            "title": "Martian plains",
            "kicker": "Mars · Plains",
            "tone": "rust",
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLqDp8W7HeRo3dYfCC1BAsoxdARAlZhk4NN7B5VVuJ43tmDuGVPf-sNgpK&s=10",
            "tags": {"zone": "plains", "temperature": "cold", "composition": "sulfates", "terrain": "flat"},
            "fields": [
                ("Lithology/mineralogy", "Sulfates, ferric oxides, and altered basalts", "Evidence of water-rock interaction; analogs include deserts, evaporites, and arid volcanic terrain."),
                ("Thermal conditions", "≈ −90 °C to 0 °C (variable)", "Thin atmosphere (~6 mbar CO₂) with a large diurnal range."),
                ("Morphology", "Expansive plains, craters, and dunes", "Surfaces suitable for rover transit and operations."),
                ("Planetary environment", "g ≈ 0.38 g, low pressure, UV/ionizing radiation", "Reference: MER/MSL/MRO. The analogy does not reproduce pressure, gravity, or radiation."),
            ],
        },
        "canyons": {
            "title": "Canyons and valleys",
            "kicker": "Mars · Canyons",
            "tone": "rust",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA00422/PIA00422~orig.jpg",
            "tags": {"zone": "canyons", "temperature": "cold", "composition": "oxides", "terrain": "rugged"},
            "fields": [
                ("Lithology/stratigraphy", "Layered sequences, iron oxides, and hydrated minerals", "Outcrops record geologic and hydrologic history; analogs include terrestrial erosional canyons and valleys."),
                ("Thermal conditions", "≈ −110 °C to 0 °C; valley-floor microclimates", "Relatively higher pressure at lower elevations; pronounced topographic gradients."),
                ("Morphology", "Scarps, slopes, and valley networks", "Rugged terrain for stratigraphic study and mobility."),
                ("Planetary environment", "g ≈ 0.38 g, thin atmosphere, radiation", "Erosion and weathering processes."),
            ],
        },
        "poles": {
            "title": "Polar caps",
            "kicker": "Mars · Polar caps",
            "tone": "ice",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA13163/PIA13163~orig.jpg",
            "tags": {"zone": "poles", "temperature": "very-cold", "composition": "water-ice", "terrain": "flat"},
            "fields": [
                ("Volatiles/composition", "H₂O ice, seasonal CO₂, and dust layers", "Ice stratigraphy; analogs include terrestrial glaciers and polar regions."),
                ("Thermal conditions", "Down to ~ −125 °C during polar winter", "Seasonal CO₂ condensation and sublimation."),
                ("Morphology", "Icy plateaus, troughs, and aeolian patterns", "Icy terrain with seasonal dynamics."),
                ("Planetary environment", "g ≈ 0.38 g, thin atmosphere, radiation", "Reference: MRO/HiRISE. Partial analogy due to atmospheric differences."),
            ],
        },
    },
}


def pick_zone_profile(planet: str, zone_filters: dict[str, str]) -> dict:
    profiles = ZONE_PROFILES.get(planet, ZONE_PROFILES["mars"])
    wanted = zone_filters.get("zone")
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
    keys = ["composition", "temperature", "terrain", "zone"]
    vals = []
    for k in keys:
        if k in zone_filters:
            vals.append(92 if profile["tags"].get(k) == zone_filters[k] else 35)
        else:
            base = 80 if k == "temperature" else 78
            vals.append(base)
    corrs = [vals[0], vals[1], int(round((vals[2] + vals[3]) / 2)), 74]
    fields = [InfoField(label=l, value=v, detail=d, correlation=corrs[i] if i < len(corrs) else None) for i, (l, v, d) in enumerate(profile["fields"])]
    return BodyInfo(kicker=profile["kicker"], title=profile["title"], tone=TONE[profile["tone"]], imageUrl=profile["imageUrl"], fields=fields)
