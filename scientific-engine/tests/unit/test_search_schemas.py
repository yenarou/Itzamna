from app.schemas.info import BodyInfo, InfoField
from app.schemas.match import Match
from app.schemas.query import LocationQuery, SearchQuery, UserLocation


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
