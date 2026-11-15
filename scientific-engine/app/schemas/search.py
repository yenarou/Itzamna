from pydantic import BaseModel, Field


class LocationQuery(BaseModel):
    lat: float
    lng: float
    radiusKm: float


class UserLocation(BaseModel):
    lat: float
    lng: float


class SearchQuery(BaseModel):
    planet: str
    earth: dict[str, str] = Field(default_factory=dict)
    zone: dict[str, str] = Field(default_factory=dict)
    location: LocationQuery | None = None
    userLocation: UserLocation | None = None
    preferIsolated: bool = True
    preferAccessible: bool = True


class InfoField(BaseModel):
    label: str
    value: str
    detail: str
    correlation: int | None = None


class BodyInfo(BaseModel):
    kicker: str
    title: str
    tone: str
    imageUrl: str | None = None
    fields: list[InfoField]


class Match(BaseModel):
    id: str
    percentage: int
    earth: BodyInfo
    zone: BodyInfo
    distanceKm: float | None = None
    fromUserKm: float | None = None
    routeKm: float | None = None
    routeMin: float | None = None
    placeName: str | None = None
    humanInterference: str | None = None
    isolated: bool | None = None
