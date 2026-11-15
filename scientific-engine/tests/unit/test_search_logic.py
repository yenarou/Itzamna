from app.services.analogs import local_climate, score_components


def test_local_climate_uses_requested_filters() -> None:
    climate = local_climate(20.0, -50.0, {"clima": "arido"})

    assert climate["_clima"] == "arido"
    assert climate["T2M"] > 20.0
    assert climate["PRECTOTCORR"] >= 0.05


def test_score_components_stays_within_valid_range() -> None:
    score, components = score_components(
        profile_tags={"zona": "canones", "temperatura": "fria", "composicion": "oxidos", "relieve": "montanoso"},
        zone_filters={"zona": "canones"},
        earth_filters={"clima": "templado", "altitud": "media", "suelo": "arenoso"},
        dist_km=10.0,
        radius_km=30.0,
        from_user_km=18.0,
        route_km=None,
        interference="baja",
        power={"T2M": 17.5, "PRECTOTCORR": 2.2, "RH2M": 45.0},
        elev=1200.0,
        soil={"sand": 60.0, "soc": 8.0, "phh2o": 7.0},
        lat=18.5,
        lon=-70.5,
    )

    assert 0.0 <= score <= 100.0
    assert all(0.0 <= value <= 100.0 for value in components.values())
