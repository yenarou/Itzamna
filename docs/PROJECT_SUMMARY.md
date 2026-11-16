# Itzamná — Project Summary

## Overview
**Itzamná** (Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas) is a web platform for identifying and comparing **terrestrial locations that are analogous to environments on the Moon and Mars**. Users select a target planet, define search characteristics and/or a geographic point with radius on Earth, and receive dynamically calculated candidate analog sites with similarity scores, geospatial context, satellite/aerial views, and scientific/advanced comparison data.

## Core Capabilities
- **Dynamic analog search (no predefined catalog):** candidates are calculated from the selected map point/radius and filters.
- **Interactive explorer UI:**
  - 3D interactive Earth globe (rotatable/zoomable).
  - 3D interactive Moon/Mars globes shown based on planet selection.
  - Location picker map (Leaflet/Esri imagery) with point, radius, and user-location support.
  - Results with similarity, distance/accessibility/human-interference context, general vs advanced information, and georeferencing.
  - Aerial/satellite map previews with pins for found Earth coordinates in results.
  - CSV/PDF export actions.
- **Scientific/heuristic analysis:** results combine external data sources when available with calculated/local fallback values (explicitly indicated in methodology/source notes).
- **Safety notice:** terms/private-property notice shown on entry (session-based) before use.
- **Internationalization-ready UI:** site configured to run in English (English-first content/labels).
- **Containerized stack:** frontend, backend API, and scientific engine runnable with Docker Compose.

## Technology Stack
- **Frontend:** Astro, TypeScript, Tailwind CSS, Leaflet, globe.gl
- **Backend (gateway/API):** ASP.NET Core Web API (.NET 10), hexagonal-style structure (`Itzamna.API`, `Application`, `Domain`, `Infrastructure`)
- **Scientific engine:** Python, FastAPI (analog scoring/search, external data providers, fallback calculations)
- **Infrastructure:** Docker, Docker Compose

## Repository Structure (high level)
```text
Itzamna/
├── frontend/                 # Astro web app (UI, explorer, i18n, scripts, styles)
├── backend/                  # .NET API gateway + hexagonal layers + tests
├── scientific-engine/        # FastAPI service (search/scoring/providers/schemas)
├── docs/                     # Project documentation
├── docker-compose.yml        # Multi-service orchestration
└── README.md
```

## Current Status (summary)
- End-to-end flow implemented: frontend explorer → backend `/api/analogs/search` → scientific engine `/search/analogs`.
- Dynamic candidate generation, georeferenced results, advanced comparison fields, and export supported.
- 3D globes for Earth/Moon/Mars and map-based location selection integrated.
- Safety/terms gate and English UI/content updates applied.
- **Note:** scientific-engine results text/fields are generated at request time; after code changes to the engine, rebuild/restart the service to return updated text (e.g. English labels/metrics).

## Quick Run (Docker)
```bash
docker compose up --build
```
- Frontend: http://localhost:4321
- Backend: http://localhost:5000
- Scientific engine: http://localhost:8001

> If accessing from another device on LAN, set frontend `PUBLIC_API_URL` to `http://<HOST_IP>:5000` and rebuild.
