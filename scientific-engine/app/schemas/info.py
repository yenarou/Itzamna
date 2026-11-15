from pydantic import BaseModel


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
