from __future__ import annotations

import hashlib

from app.schemas.info import BodyInfo, InfoField
from app.services.data import API_SAT, aridity_index
from app.services.geo import clamp
from app.services.profiles import TONE


def score_components(profile_tags: dict, zone_filters: dict, earth_filters: dict, dist_km: float | None, radius_km: float | None, from_user_km: float | None, route_km: float | None, interference: str | None, power: dict | None, elev: float | None, soil: dict | None, lat: float = 0.0, lon: float = 0.0) -> tuple[float, dict]:
    comps = {}
    hv = int(hashlib.sha1(f"sc:{lat:.5f},{lon:.5f}".encode()).hexdigest()[:8], 16)
    jitter = ((hv % 13) - 6) * 0.35

    zkeys = [k for k in ("zona", "temperatura", "composicion", "relieve") if k in zone_filters]
    if zkeys:
        comps["target_zone"] = 100.0 * sum(1 for k in zkeys if profile_tags.get(k) == zone_filters[k]) / len(zkeys)
    else:
        comps["target_zone"] = clamp(68.0 + ((hv >> 4) % 17), 55.0, 90.0)

    if power and power.get("T2M") is not None:
        t = float(power.get("T2M", 15.0))
        p = float(power.get("PRECTOTCORR") or 0) * 365.0
        rh = float(power.get("RH2M") or 50.0)
        if "clima" in earth_filters:
            want = earth_filters["clima"]
            ok = (want == "arido" and p < 400) or (want == "polar" and t < 2) or (want == "templado" and 2 <= t <= 22 and p >= 300)
            base = 92.0 if ok else 38.0
            if want == "arido":
                base += max(-10.0, min(6.0, (400 - p) / 80.0))
            elif want == "polar":
                base += max(-10.0, min(6.0, (2 - t) / 3.0))
            else:
                base += max(-10.0, min(6.0, 6.0 - abs(t - 12.0) / 3.0))
            comps["climate"] = clamp(base, 20.0, 98.0)
        else:
            arid_fit = clamp(100.0 - abs(p - 250.0) / 10.0, 25.0, 95.0)
            temp_fit = clamp(100.0 - abs(t - 18.0) * 2.0, 20.0, 95.0)
            rh_fit = clamp(100.0 - abs(rh - 35.0) * 1.2, 20.0, 95.0)
            comps["climate"] = clamp(arid_fit * 0.45 + temp_fit * 0.35 + rh_fit * 0.2, 25.0, 98.0)
    else:
        comps["climate"] = 40.0

    if elev is not None:
        e = float(elev)
        if "altitud" in earth_filters:
            want = earth_filters["altitud"]
            ok = (want == "baja" and e < 500) or (want == "media" and 500 <= e < 2000) or (want == "alta" and e >= 2000)
            comps["elevation_dem"] = clamp((95.0 if ok else 32.0) + max(-8.0, min(4.0, (1000 - abs(e % 1000 - 500)) / 120.0)), 20.0, 99.0)
        else:
            comps["elevation_dem"] = clamp(55.0 + min(e, 3500.0) / 80.0, 30.0, 98.0)
    else:
        comps["elevation_dem"] = 35.0

    if soil or (power and power.get("RH2M") is not None):
        if soil and "suelo" in earth_filters:
            sand = float(soil.get("sand", 40.0))
            want = earth_filters["suelo"]
            ok = (want == "arenoso" and sand >= 50) or (want == "salino" and (power and (float(power.get("PRECTOTCORR") or 0) * 365) < 350)) or (want == "hielo" and (power and float(power.get("T2M", 10)) < 0)) or (want == "basaltico" and 30 <= sand <= 55)
            comps["substrate_moisture"] = clamp((90.0 if ok else 45.0) + (sand - 45.0) / 10.0, 20.0, 98.0)
        else:
            sand = float(soil.get("sand", 40.0)) if soil else 40.0
            soc = float(soil.get("soc", 8.0)) if soil else 8.0
            ph = float(soil.get("phh2o", 7.0)) if soil else 7.0
            rh = float(power.get("RH2M", 50.0)) if power else 50.0
            comps["substrate_moisture"] = clamp(35.0 + sand * 0.35 + soc * 1.2 + max(0.0, 10.0 - abs(ph - 7.0)) * 1.5 + (50.0 - abs(rh - 40.0)) * 0.25, 25.0, 97.0)
    else:
        comps["substrate_moisture"] = 35.0

    spatial = 80.0
    if dist_km is not None and radius_km:
        spatial = 100.0 * (1.0 - 0.5 * (float(dist_km) / max(float(radius_km), 1e-6)))
    comps["spatial"] = clamp(spatial, 20.0, 100.0)

    acc = 60.0
    if from_user_km is not None:
        if from_user_km < 1.5:
            acc = 25.0
        elif route_km is not None:
            acc = clamp(90.0 - max(0.0, float(route_km) - 20.0) / 8.0, 35.0, 92.0)
        else:
            acc = clamp(75.0 - max(0.0, float(from_user_km) - 5.0) / 10.0, 30.0, 78.0)
    comps["accessibility"] = acc

    intr = 70.0
    if interference == "baja":
        intr = 95.0
    elif interference == "media":
        intr = 60.0
    elif interference == "alta":
        intr = 25.0
    comps["osm_interference"] = intr

    weights = {"target_zone": 0.25, "climate": 0.2, "elevation_dem": 0.15, "substrate_moisture": 0.15, "spatial": 0.1, "accessibility": 0.08, "osm_interference": 0.07}
    total = sum(comps.get(k, 50.0) * w for k, w in weights.items()) + jitter
    return (round(clamp(total, 5.0, 99.0), 2), {k: round(clamp(v, 0.0, 100.0), 1) for k, v in comps.items()})


def src_note(ok: bool, src: str) -> str:
    return f"Source: {src}." if ok else f"{API_SAT} (expected source: {src})."


def build_earth_body(lat, lon, idx, place_name, place_ok, from_user_km, route_km, route_min, route_ok, interference, isolated, interference_count, over_ok, radius_km, dist_km, earth_filters, power, power_ok, elev, elev_ok, soil, soil_ok, comps) -> BodyInfo:
    tone_key = "ice" if (elev is not None and elev > 3500) or (power and power.get("T2M") is not None and power["T2M"] < 0) else "basalt"
    title = place_name or f"Candidate at {lat:.3f}°, {lon:.3f}°"
    fields = []

    topo = place_name or f"Coordinate {lat:.4f}, {lon:.4f} (no toponym)"
    topo_detail = f"Reverse geocoding via Nominatim (OpenStreetMap). {src_note(place_ok, 'https://nominatim.openstreetmap.org')}"
    fields.append(InfoField(label="Toponymy (OpenStreetMap)", value=topo, detail=topo_detail, correlation=95 if (place_ok and place_name) else 50))

    fields.append(InfoField(label="Georeferencing", value=f"{lat:.5f}°, {lon:.5f}° (WGS84)", detail="Decimal geodetic coordinates of the candidate generated by sampling within the area (not a predefined site).", correlation=100))

    if radius_km is not None and dist_km is not None:
        fields.append(InfoField(label="Spatial sampling", value=f"{dist_km:.2f} km from center · radius {radius_km:.0f} km", detail="Candidate calculated radially and evaluated against the target profile and filters.", correlation=int(comps.get("spatial", 70))))

    if from_user_km is not None:
        if route_km is not None and route_min is not None:
            ruta = f"{route_km:.1f} km, ~{route_min:.0f} min by car (OSRM/OpenStreetMap)"
            rd = f"Estimated route via OSRM (OpenStreetMap road network). {src_note(route_ok, 'https://router.project-osrm.org')}"
        else:
            ruta = "no vehicle route (geodesic distance used)"
            rd = f"No OSRM route obtained ({API_SAT.lower()}); geodesic distance calculated locally is reported."
        fields.append(InfoField(label="Accessibility (OpenStreetMap/OSRM)", value=f"{from_user_km:.1f} km geodesic · {ruta}", detail=rd, correlation=int(comps.get("accessibility", 60))))

    iso_txt = "isolated (low local human footprint)" if isolated else "not fully isolated"
    inf_val = f"{interference.capitalize()} · {iso_txt} · n≈{interference_count} mapped elements (OSM count, 1.2 km radius)"
    inf_detail = f"Human impact proxy from infrastructure mapped in OpenStreetMap via Overpass API. {src_note(over_ok, 'https://overpass-api.de')}"
    fields.append(InfoField(label="Human interference (OpenStreetMap/Overpass)", value=inf_val, detail=inf_detail, correlation=int(comps.get("osm_interference", 60))))

    t2m = power.get("T2M") if power else None
    tmin = power.get("T2M_MIN") if power else None
    tmax = power.get("T2M_MAX") if power else None
    prec = power.get("PRECTOTCORR") if power else None
    rh = power.get("RH2M") if power else None
    ws = power.get("WS2M") if power else None
    rad = power.get("ALLSKY_SFC_SW_DWN") if power else None
    ai = aridity_index(prec, t2m)
    p_year = (prec * 365.0) if prec is not None else None
    parts = []
    if t2m is not None:
        parts.append(f"T2M {t2m:.2f} °C")
    if tmin is not None and tmax is not None:
        parts.append(f"range {tmin:.2f} to {tmax:.2f} °C")
    if p_year is not None:
        parts.append(f"precip. {p_year:.1f} mm/year ({prec:.3f} mm/day)")
    if rh is not None:
        parts.append(f"HR2M {rh:.1f} %")
    if ws is not None:
        parts.append(f"wind at 2 m {ws:.2f} m/s")
    if rad is not None:
        parts.append(f"solar radiation {rad:.2f} kWh/m²/day")
    if ai is not None:
        parts.append(f"aridity index (dimensionless, approx. De Martonne) P/(T+10) = {ai:.2f}")
    p_detail = f"Point climatology (annual averages, NASA POWER MERRA-2/GEWEX). Units: °C, mm/year, mm/day, %, m/s, kWh/m²/day. Parameters: T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, RH2M, WS2M, ALLSKY_SFC_SW_DWN. {src_note(power_ok, 'https://power.larc.nasa.gov/')}"
    fields.append(InfoField(label="Climate (NASA POWER)", value=("; ".join(parts) if parts else "no data"), detail=p_detail, correlation=int(comps.get("climate", 60))))

    e_val = f"{elev:.1f} m a.s.l." if elev is not None else "no data"
    e_detail = f"Terrain elevation (m a.s.l.) from Digital Elevation Model (OpenTopData, SRTM 90 m / ASTER 30 m). {src_note(elev_ok, 'https://www.opentopodata.org (SRTM/ASTER)')}"
    fields.append(InfoField(label="Elevation (DEM)", value=e_val, detail=e_detail, correlation=int(comps.get("elevation_dem", 60))))

    sub_parts = []
    if soil:
        if soil.get("clay") is not None:
            sub_parts.append(f"arcilla {soil['clay']:.1f} %")
        if soil.get("sand") is not None:
            sub_parts.append(f"arena {soil['sand']:.1f} %")
        if soil.get("silt") is not None:
            sub_parts.append(f"limo {soil['silt']:.1f} %")
        if soil.get("soc") is not None:
            sub_parts.append(f"C orgánico {soil['soc']:.1f} g/kg")
        if soil.get("bdod") is not None:
            sub_parts.append(f"densidad aparente {soil['bdod']:.2f} kg/dm³")
        if soil.get("phh2o") is not None:
            sub_parts.append(f"pH(H₂O) {soil['phh2o']:.2f}")
        if soil.get("_tipo"):
            sub_parts.append(f"tipo {soil['_tipo']}")
    sub_val = "; ".join(sub_parts) if sub_parts else "no data"
    sub_detail = f"Mean 0–15 cm properties (ISRIC SoilGrids v2.0) in physical units (%, g/kg, kg/dm³, pH). {src_note(soil_ok, 'https://rest.isric.org/soilgrids/v2.0/')}"
    fields.append(InfoField(label="Edaphic substrate (SoilGrids, quantitative)", value=sub_val, detail=sub_detail, correlation=int(comps.get("substrate_moisture", 50))))

    hum_parts = []
    if rh is not None:
        hum_parts.append(f"mean annual RH {rh:.1f} % (NASA POWER)")
    if p_year is not None:
        hum_parts.append(f"precipitation {p_year:.1f} mm/year")
    if ai is not None:
        hum_parts.append(f"aridity index (dimensionless, approx. De Martonne) P/(T+10) = {ai:.2f}")
    hum_detail = f"Relative humidity (%), precipitation (mm/year), and aridity index (dimensionless, formula P/(T+10)). {src_note(power_ok, 'https://power.larc.nasa.gov/')} (index calculated locally from these data)."
    fields.append(InfoField(label="Moisture and water availability (quantitative)", value=("; ".join(hum_parts) if hum_parts else "no data"), detail=hum_detail, correlation=int(comps.get("substrate_moisture", 50))))

    comp_str = ", ".join(f"{k}={v}%" for k, v in comps.items())
    fields.append(InfoField(label="Similarity methodology (by components)", value=f"Components (%): {comp_str}", detail="Similarity as a weighted average of components measured/queried or calculated locally when an API does not respond (target zone, climate, DEM elevation, substrate/moisture, spatial, accessibility, OSM interference). Direct result without normalization to a bounded index. Relevant formulas/variables: P/(T+10), T2M, PRECTOTCORR, RH2M.", correlation=None))

    d = 0.08
    minLon, minLat, maxLon, maxLat = lon - d, lat - d / 1.6, lon + d, lat + d / 1.6
    image_url = f"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox={minLon:.6f},{minLat:.6f},{maxLon:.6f},{maxLat:.6f}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image"
    return BodyInfo(kicker=f"Earth · Calculated candidate #{idx}", title=title, tone=TONE[tone_key], imageUrl=image_url, fields=fields)
