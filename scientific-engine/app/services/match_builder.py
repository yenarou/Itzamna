from __future__ import annotations

import hashlib

from app.schemas.match import Match
from app.services.data import fetch_elevation, fetch_nasa_power, fetch_soil, human_interference, local_climate, local_elevation, local_soil, reverse_geocode_name, route_from_user
from app.services.geo import haversine_km
from app.services.profiles import ZONE_PROFILES, build_zone_body, pick_zone_profile
from app.services.scoring import build_earth_body, score_components


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


def search_analogs(query) -> list[Match]:
    planet = query.planet if query.planet in ZONE_PROFILES else "marte"
    zone_filters = dict(query.zone or {})
    earth_filters = dict(query.earth or {})
    profile = pick_zone_profile(planet, zone_filters)
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

    from app.services.geo import generate_candidates

    candidates = generate_candidates(center_lat, center_lon, radius_km, 6)
    zone_body = build_zone_body(profile, zone_filters)
    results = []
    for lat, lon, dist in candidates:
        m = build_match(planet, len(results) + 1, lat, lon, dist, radius_km, query.location, user_loc, prefer_accessible, earth_filters, zone_filters, profile, zone_body)
        if m is not None:
            results.append(m)
        if len(results) >= 6:
            break

    if not results:
        lat, lon, dist = candidates[0]
        m = build_match(planet, 1, lat, lon, dist, radius_km, query.location, user_loc, prefer_accessible, earth_filters, zone_filters, profile, zone_body)
        if m is not None:
            results.append(m)

    results.sort(key=lambda m: m.percentage, reverse=True)
    return results
