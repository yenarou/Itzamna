from __future__ import annotations

from math import asin, atan2, cos, degrees, radians, sin, sqrt


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


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def generate_candidates(center_lat, center_lon, radius_km, count):
    pts = [(center_lat, center_lon, 0.0)]
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
