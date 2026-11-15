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
