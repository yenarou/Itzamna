def test_search_endpoint_returns_matches(client, monkeypatch) -> None:
    monkeypatch.setattr("app.services.analogs.reverse_geocode_name", lambda lat, lon: ("Test Valley", True))
    monkeypatch.setattr("app.services.analogs.human_interference", lambda lat, lon: ("low", True, 3, True))
    monkeypatch.setattr(
        "app.services.analogs.fetch_nasa_power",
        lambda lat, lon: ({
            "T2M": 18.0,
            "T2M_MIN": 10.0,
            "T2M_MAX": 26.0,
            "PRECTOTCORR": 2.5,
            "RH2M": 42.0,
            "WS2M": 3.2,
            "ALLSKY_SFC_SW_DWN": 5.1,
        }, True),
    )
    monkeypatch.setattr("app.services.analogs.fetch_elevation", lambda lat, lon: (1200.0, True))
    monkeypatch.setattr(
        "app.services.analogs.fetch_soil",
        lambda lat, lon: ({
            "clay": 18.0,
            "sand": 62.0,
            "silt": 20.0,
            "soc": 7.5,
            "bdod": 1.3,
            "phh2o": 7.0,
        }, True),
    )
    monkeypatch.setattr("app.services.analogs.route_from_user", lambda user_lat, user_lon, lat, lon: (13.5, 20.0, True))

    response = client.post(
        "/analogs/search",
        json={
            "planet": "mars",
            "earth": {"climate": "temperate"},
            "zone": {"zone": "canyons"},
            "location": {"lat": 18.5, "lng": -70.5, "radiusKm": 30.0},
            "userLocation": {"lat": 19.2, "lng": -70.9},
            "preferAccessible": True,
            "preferIsolated": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) >= 1

    first_match = payload[0]
    assert isinstance(first_match["percentage"], int)
    assert first_match["percentage"] >= 0
    assert "earth" in first_match
    assert "zone" in first_match
    assert first_match["zone"]["title"]
