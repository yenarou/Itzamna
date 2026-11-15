"""Compatibility facade for analog search services.

The implementation is split into focused modules:
- profiles: zone profiles and presentation data
- geo: geographic/math helpers
- providers: external data providers and local fallbacks
- search: scoring, match building, and search orchestration
"""

from .search import search_analogs

__all__ = ["search_analogs"]
