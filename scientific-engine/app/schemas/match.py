from pydantic import BaseModel

from app.schemas.info import BodyInfo


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
