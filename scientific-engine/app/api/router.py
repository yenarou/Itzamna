from fastapi import APIRouter

from app.schemas.search import Match, SearchQuery
from app.services.analogs import search_analogs

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "scientific-engine",
    }


@router.post("/analogs/search", response_model=list[Match])
def search(query: SearchQuery) -> list[Match]:
    return search_analogs(query)
