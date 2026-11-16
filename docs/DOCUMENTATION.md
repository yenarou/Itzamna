# Itzamná — Documentation

## 1. Purpose
Itzamná helps users explore **terrestrial analogs** for lunar and Martian environments. Given a target planet (Moon or Mars), optional terrain/environment filters, and/or a selected Earth location with search radius, the system computes candidate areas on Earth and presents:
- similarity percentage and component-based methodology,
- georeferencing and contextual fields,
- accessibility/human-interference and route-related context (when available),
- aerial/satellite map previews with location pins,
- general and advanced comparison information.

The search is **dynamic/calculated** (not a fixed catalog). Some values come from external APIs; when unavailable or rate-limited, the engine uses calculated/local fallback values and marks source/fallback notes.

---

## 2. Architecture

### Components
1. **Frontend (`frontend/`, Astro + TypeScript + Tailwind)**
   - Renders landing/content/explorer views, 3D globes (globe.gl), Leaflet location map, results panels, and export actions.
   - Sends search requests to backend API (`PUBLIC_API_URL`).
2. **Backend API (`backend/`, ASP.NET Core .NET 10)**
   - Acts as HTTP gateway/proxy and validation layer.
   - Exposes health endpoints and forwards analog search requests to scientific engine.
   - Hexagonal-style projects: `Itzamna.API`, `Itzamna.Application`, `Itzamna.Domain`, `Itzamna.Infrastructure`.
3. **Scientific Engine (`scientific-engine/`, FastAPI + Python)**
   - Computes candidate analogs, similarity components/scores, georeferencing, environmental/substrate/moisture/accessibility/interference fields.
   - Integrates external providers (e.g. NASA POWER, elevation/soil/geocoding/routing/OSM sources where configured) with fallback/local estimation logic.

### Request Flow
`Browser (Frontend)` → `POST /api/analogs/search` (`Backend`) → `POST /search/analogs` (`Scientific Engine`) → scored candidate results → rendered in UI.

---

## 3. Setup & Execution

### Prerequisites
- Docker + Docker Compose (recommended), or
- Node.js 22+ / npm, .NET 10 SDK, Python 3.12+

### Run with Docker Compose (recommended)
```bash
docker compose up --build
```
Services/ports (default compose mapping):
- Frontend: `http://localhost:4321`
- Backend: `http://localhost:5000` (container 8080)
- Scientific engine: `http://localhost:8001` (container 8000)

**Notes:**
- `PUBLIC_API_URL` for frontend is set for browser access from host (default `http://localhost:5000` in compose). For LAN access use `http://<HOST_IP>:5000` and rebuild.
- After source changes, rebuild images (`docker compose up --build`) because frontend files are copied at build time.

### Run locally (development)

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
dotnet restore
dotnet build Itzamna.slnx
dotnet run --project src/Itzamna.API/Itzamna.API.csproj
```
Configure scientific engine base URL as needed (e.g. `ScientificEngine__BaseUrl`).

#### Scientific engine
```bash
cd scientific-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 4. API Endpoints

### Backend (gateway)
- `GET /api/health` — backend health.
- `GET /api/health/scientific-engine` — backend-to-scientific-engine health proxy/check.
- `POST /api/analogs/search` — forwards analog search request to scientific engine and returns results.

**Search request (representative shape):**
```json
{
  "planet": "moon",
  "earth": { "climate": "arid", "elevation": "medium", "soil": "sandy", "humidity": "low" },
  "zone": { "zone": "canyons", "temperature": "cold", "composition": "oxides", "terrain": "rugged" },
  "tags": { "...": "..." },
  "location": { "lat": 0.0, "lng": 0.0, "radiusKm": 500 },
  "userLocation": { "lat": 0.0, "lng": 0.0 },
  "preferIsolated": true,
  "preferAccessible": true
}
```
(Filter keys and options use English identifiers and are defined by the frontend explorer and scientific-engine profiles.)

### Scientific engine
- `GET /health` — engine health.
- `POST /search/analogs` — computes and returns analog candidates/matches.

---

## 5. Frontend Behavior (Explorer)

### Main views
- **Home / content sections:** project context, mission/vision/about information.
- **Explorer:** planet selection, characteristic filters, map-based location + radius, search execution, and results visualization.

### Key UI features
- **3D globes (globe.gl):** interactive Earth globe and Moon/Mars globe (rotatable/zoomable) depending on selection.
- **Location selection:** Leaflet map (satellite imagery/tiles), click-to-place point, coordinate inputs, radius selector, and optional use-my-location flow.
- **Results panel:** candidate tabs/matches, similarity score, georeferencing, aerial/satellite previews with pins, general/advanced information, and comparison fields.
- **Advanced information:** detailed fields (e.g. climate, elevation/DEM, edaphic substrate, moisture/water availability, accessibility, human interference, similarity methodology/components) with source/fallback notes when applicable.
- **Exports:** CSV and PDF export actions for results.
- **Safety notice:** private-property/safety terms dialog shown on entry/session as configured.

### Language
- UI is configured for **English** content/labels. Result text generated by the scientific engine depends on the engine version running (rebuild/restart engine to apply backend text changes).

---

## 6. Scientific Engine Notes
- Produces candidate matches with georeferenced Earth locations and similarity metrics.
- Similarity is reported as component-based weighted scoring (e.g. target zone, climate, elevation/DEM, substrate/moisture, spatial, accessibility, OSM interference) without forcing normalization beyond the reported methodology.
- Uses external data providers when available and falls back to calculated/local estimates on failure/saturation; fallback/source details are included in field descriptions/notes.
- Outputs may vary with network/API availability and data coverage.

---

## 7. Operational Notes & Caveats
- **Rebuild after changes:** with Docker, rebuild images after frontend/engine/backend code updates.
- **Browser vs container networking:** frontend runs in browser; API URL must be reachable from the client machine.
- **External dependencies:** map tiles, imagery, and scientific data providers require network access; fallbacks are used when possible.
- **Performance:** imagery/map loading and external API calls can affect latency; UI and map settings include optimizations, but results still depend on data sources.
- **No full automated E2E verification included here:** visual/interactive behavior should be validated in a browser (and in Docker on target machines).

---

## 8. Related Files
- `README.md` — base project readme
- `docs/PROJECT_SUMMARY.md` — concise project summary
- `frontend/src/` — UI, explorer scripts/components/styles
- `backend/src/Itzamna.API/` — API endpoints and gateway integration
- `scientific-engine/app/services/` — search, scoring, providers, data logic
- `docker-compose.yml` — service orchestration
