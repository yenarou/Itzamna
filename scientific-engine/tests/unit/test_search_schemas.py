from app.schemas.info import BodyInfo, InfoField
from app.schemas.match import Match
from app.schemas.query import LocationQuery, SearchQuery, UserLocation
from app.services.data import human_interference


def test_search_schema_module_supports_tag_filters() -> None:
    query = SearchQuery(
        planet="marte",
        tags={"amenity": "parking"},
        location=LocationQuery(lat=18.5, lng=-70.5, radiusKm=30.0),
        userLocation=UserLocation(lat=19.2, lng=-70.9),
    )

    assert query.tags == {"amenity": "parking"}


def test_human_interference_filters_by_tag_and_access(monkeypatch) -> None:
    def fake_http_json(url: str, timeout: float = 4.0, headers: dict | None = None):
        assert "amenity" in url
        return {
            "elements": [
                {"tags": {"amenity": "parking", "access": "private"}},
                {"tags": {"amenity": "parking", "access": "yes"}},
                {"tags": {"amenity": "restaurant", "access": "permissive"}},
            ]
        }

    monkeypatch.setattr("app.services.data._http_json", fake_http_json)

    result = human_interference(18.5, -70.5, tag_filters={"amenity": "parking"}, prefer_accessible=True)

    assert result[0] == "baja"
    assert result[2] == 1
    assert result[3] is True


def test_search_schema_modules_are_available() -> None:
    query = SearchQuery(
        planet="marte",
        location=LocationQuery(lat=18.5, lng=-70.5, radiusKm=30.0),
        userLocation=UserLocation(lat=19.2, lng=-70.9),
    )

    assert query.planet == "marte"
    assert query.location is not None
    assert query.location.radiusKm == 30.0

    match = Match(
        id="candidate-1",
        percentage=76,
        earth=BodyInfo(
            kicker="Tierra",
            title="Candidato de prueba",
            tone="neutral",
            fields=[InfoField(label="Clima", value="templado", detail="Detalle", correlation=80)],
        ),
        zone=BodyInfo(
            kicker="Zona",
            title="Zona de prueba",
            tone="neutral",
            fields=[InfoField(label="Tipo", value="canones", detail="Detalle", correlation=75)],
        ),
    )

    assert match.id == "candidate-1"
    assert match.percentage == 76
