# NASA Space Apps Challenge 2026 — Project Submission Documentation (Itzamná)

> **Purpose:** Complete, submission-ready documentation for the Itzamná project, structured according to the NASA Space Apps Challenge 2026 Project Submission Guide. Replace bracketed placeholders (e.g. demo/final links, team/challenge details) before submitting.

---

## Project Name
**Itzamná**  
*Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas*

---

## High-Level Project Summary
**Itzamná** is a web platform that helps users identify and compare **terrestrial locations analogous to environments on the Moon and Mars**. Users select a target body (Moon or Mars), define environmental/terrain characteristics and/or choose a point and search radius on Earth, and the system dynamically computes candidate analog sites (not from a predefined catalog). 

For each candidate, Itzamná provides a similarity score with a component-based methodology, georeferencing, accessibility and human-interference context, and general/advanced scientific comparison fields. The explorer includes interactive 3D Earth/Moon/Mars globes, a map-based location picker, and aerial/satellite result previews with pins at found coordinates. When external data sources are unavailable or rate-limited, the scientific engine uses calculated/local fallback values and clearly marks source/fallback notes, enabling robust exploration for mission planning, education, and analog-site discovery.

---

## Link to Project Demo
`[REQUIRED — add a publicly accessible link with no login/permission/registration]`

- **Accepted formats (per guide):**
  - **Video:** 30 seconds or less (if not in English, include English subtitles), OR
  - **Slide deck:** up to 7 slides including title and introductory slides.
- **Host externally:** YouTube, Google Drive, GitHub, OneDrive, Dropbox, or similar.
- **Before submitting:** set public access and test in a private/incognito browser.
- **Suggested demo content:** team/challenge intro, problem addressed, how Itzamná works (planet selection + map/radius + dynamic search), NASA/open data use, results/comparison views, and future impact.

---

## Link to Final Project
`[REQUIRED — add a publicly accessible link with no login/permission/registration]`

- Recommended: public repository and/or deployed web application (e.g. GitHub repo, hosted frontend + API endpoints, or cloud-hosted demo).  
- Ensure judges can access all linked materials without credentials.
- **Repository (local project):** `/home/jax/Documents/Files/Personal/Hackathon/Itzamna` (publish to a public Git hosting service and paste link here).

---

## Detailed Project Description

### What It Does
Itzamná enables **dynamic, location-aware search for Earth analogs** of lunar and Martian zones:
- Selects **target planet:** Moon or Mars.
- Accepts **search inputs:** characteristic filters (Earth/zone criteria), an Earth map point, and a search radius; can incorporate user location and preferences (e.g. isolation/accessibility) where provided.
- Computes **candidate terrestrial analog sites** on demand with:
  - **Similarity percentage** and **component-based methodology** (e.g. target zone, climate, elevation/DEM, substrate/moisture, spatial, accessibility, human interference/OSM-related factors as applicable).
  - **Georeferencing** (coordinates/derived location context).
  - **Environmental and terrain context** (climate indicators, elevation, edaphic/substrate and moisture-related fields where available).
  - **Accessibility and human-interference context** (including routing/OSM-derived signals when available).
  - **Aerial/satellite map previews with pins** for found Earth coordinates.
  - **General vs. advanced information** views and side-by-side comparison context (Earth vs Moon/Mars).
- Supports **interactive exploration:** 3D rotatable/zoomable Earth, Moon, and Mars globes; Leaflet-based location selection with satellite imagery; result tabs and exports (CSV/PDF).

### How It Works
**Architecture (3-tier):**
1. **Frontend** (`frontend/`, Astro + TypeScript + Tailwind CSS)
   - Explorer UI, 3D globes (`globe.gl`), Leaflet maps, result rendering, and export actions.
   - Sends search requests to backend API (`PUBLIC_API_URL`).
2. **Backend API / Gateway** (`backend/`, ASP.NET Core Web API, .NET 10)
   - Hexagonal-style structure: `Itzamna.API`, `Itzamna.Application`, `Itzamna.Domain`, `Itzamna.Infrastructure`.
   - Validates/proxies requests and exposes health/search endpoints.
3. **Scientific Engine** (`scientific-engine/`, Python + FastAPI)
   - Generates dynamic candidates, computes similarity components/scores, enriches results via external providers, and applies calculated/local fallbacks when sources fail or are saturated.
   - Returns structured matches rendered by the frontend.

**Request flow:** Browser (Frontend) → `POST /api/analogs/search` (Backend) → `POST /search/analogs` (Scientific Engine) → scored candidate results → UI visualization.

**Key API endpoints**
- Backend: `GET /api/health`, `GET /api/health/scientific-engine`, `POST /api/analogs/search`
- Scientific engine: `GET /health`, `POST /search/analogs`

### Benefits
- **Decision support for analog selection:** faster identification of Earth sites with Moon/Mars-relevant characteristics for research, training, robotics testing, and mission simulation planning.
- **Transparency:** similarity broken into components/methodology with source/fallback notes instead of opaque results.
- **Resilience:** calculated/local fallback values keep searches usable when external APIs are unavailable or rate-limited.
- **Accessibility & safety awareness:** includes accessibility/human-interference context and an on-entry safety/private-property notice.
- **Interactive geospatial understanding:** 3D planetary views and pinned aerial previews help users connect planetary targets to real Earth locations.

### What We Hope to Achieve
- Provide a practical, extensible tool for discovering and evaluating terrestrial analog sites for lunar/Martian exploration scenarios.
- Improve reproducibility and explainability of analog selection through explicit scoring components and data provenance/fallback labeling.
- Enable future integration of richer planetary datasets, higher-fidelity terrain/environment models, and field-validation workflows.

### Tools, Languages, Hardware, and Software
- **Frontend:** Astro, TypeScript, Tailwind CSS, Leaflet, `globe.gl`, Vite
- **Backend:** C#, ASP.NET Core Web API (.NET 10), .NET SDK
- **Scientific engine:** Python 3.12+, FastAPI, Uvicorn
- **Infrastructure/DevOps:** Docker, Docker Compose, Git
- **Data/imagery services (runtime/external):** NASA POWER API, OpenTopoData, ISRIC SoilGrids, OpenStreetMap/Nominatim, Overpass API, OSRM, Esri World Imagery/Reference tiles (see References sections)
- **Hardware:** No specialized hardware required to run the software; standard computer with modern browser and internet access for external data/tiles (offline/limited-network behavior uses fallbacks where implemented).

### Repository Structure (high level)
```text
Itzamna/
├── frontend/                 # Astro web app (UI, explorer, scripts, styles)
├── backend/                  # .NET API gateway + hexagonal layers + tests
│   ├── src/Itzamna.API/
│   ├── src/Itzamna.Application/
│   ├── src/Itzamna.Domain/
│   └── src/Itzamna.Infrastructure/
├── scientific-engine/        # FastAPI service (search/scoring/providers/schemas)
├── docs/                     # Project documentation
├── docker-compose.yml
└── README.md
```

### How to Run (for judges/reviewers)
**Docker Compose (recommended):**
```bash
docker compose up --build
```
- Frontend: `http://localhost:4321`
- Backend: `http://localhost:5000`
- Scientific engine: `http://localhost:8001`

**Notes:** For LAN access set frontend `PUBLIC_API_URL` to `http://<HOST_IP>:5000` and rebuild. After engine code changes, rebuild/restart the scientific service so updated result text/fields are returned for new searches. External API/tile availability may affect enrichment; fallbacks are applied where possible.

---

## Use of Super Intelligence (SI)
**Did you utilize any Super Intelligence (SI) tools and software in preparing your solution?**  
`[TEAM TO CONFIRM AND UPDATE — be accurate and transparent]`

**Template response (edit as appropriate):**
- **Project ideation and core solution design:** `[State whether SI was/was not used. Per guide, SI should not be used to come up with the idea of how to solve the challenge; confirm accordingly.]`
- **Code, text, images, audio, or data assistance:** `[Describe any SI tools used (e.g. coding assistants, image generation, LLMs) and exactly where/how.]`
- **Labeling/attribution:** Any SI-generated **images/videos** must include a visible watermark; any SI-generated **audio/code/data** must be acknowledged in descriptive text and metadata, as required by the guide. Generated content must not use/contain/modify NASA branding or design elements.
- **This documentation file:** Portions of this submission documentation may have been drafted/organized with assistance from an AI coding assistant based on repository contents and team-provided materials; the team should review, verify, and add required SI acknowledgments/watermarks/metadata for any SI-generated assets included in the final submission.

> Judges evaluate originality, intent, and execution based on the SI-assisted elements you include and identify. Ensure all SI use is clearly disclosed in the project and materials.

---

## NASA Data
`[REQUIRED for Global Award eligibility: use at least one NASA data/resource — verify and keep accurate]`

**NASA data/resources used in this project:**
1. **NASA POWER (Prediction Of Worldwide Energy Resources) Project — Climatology/Point API**  
   - **Endpoint used:** `https://power.larc.nasa.gov/api/temporal/climatology/point`  
   - **Use in Itzamná:** retrieval of climatological parameters (e.g. temperature metrics, precipitation, relative humidity, wind speed, surface solar radiation such as `T2M`, `T2M_MIN`, `T2M_MAX`, `PRECTOTCORR`, `RH2M`, `WS2M`, `ALLSKY_SFC_SW_DWN`) to inform environmental characterization and similarity assessment for terrestrial analog candidates.  
   - **Source in code:** `scientific-engine/app/services/providers.py` (`fetch_nasa_power`).  
   - **Notes:** When NASA POWER or other external services are unavailable/saturated, the engine falls back to calculated/local estimates and records source/fallback notes.

**Additional NASA-related visualization assets (indirect/common library assets — confirm attribution as applicable):**
- The Earth 3D globe visualization uses three-globe example textures (e.g. Blue Marble–style globe and topology/bump imagery) loaded from `unpkg.com/three-globe/example/img/...` in `frontend/src/scripts/explorer.ts`. These assets are commonly derived from NASA imagery in public examples; teams should verify and cite the specific asset provenance in the final submission materials if required.

> **Action item:** Confirm and list any other specific NASA datasets/tools your team used (e.g. mission datasets, planetary data products, imagery catalogs) and include exact dataset names/URLs/DOIs where applicable.

---

## Space Agency Partner Data and Other References
List all data, resources, and tools used (including open-source/free resources and any copyrighted materials with permission). You are encouraged to use 2026 Space Apps Space Agency Partner data/resources where relevant.

### Space Agency Partner Data
`[TEAM TO CONFIRM]`  
- No specific 2026 Space Apps Space Agency Partner datasets are explicitly integrated in the current codebase beyond the sources listed below. If your team used data/resources from any 2026 partners (e.g. CSA, ESA, ISRO, JAXA, KASA, ASI, AEB, UKSA, UAE MBRSC, and others listed by Space Apps), add them here with dataset/resource names and URLs.

### Other External Data Sources & APIs (used by scientific engine / app)
- **OpenTopoData** (`https://api.opentopodata.org`) — elevation lookups (e.g. SRTM/ASTER datasets as queried) for terrain/elevation context; fallback to local estimates on failure.
- **ISRIC SoilGrids** (`https://rest.isric.org/soilgrids/v2.0/properties/query`) — soil property estimates (e.g. clay/sand/silt/soc/bdod/ph) for substrate characterization; fallback on failure.
- **OpenStreetMap / Nominatim** (`https://nominatim.openstreetmap.org`) — reverse geocoding/place naming context.
- **Overpass API** (`https://overpass-api.de/api/interpreter`) — human-interference/context signals (e.g. nearby mapped features) with fallback heuristics.
- **OSRM** (`https://router.project-osrm.org`) — routing/distance-time estimates from user location to candidates when available.
- **Esri ArcGIS Online tiles/services** (via Leaflet) — satellite/basemap and reference layers for location picking and result map previews (e.g. `World_Imagery`, `World_Boundaries_and_Places`).

### Libraries, Frameworks & Tools
- **Frontend:** Astro, TypeScript, Tailwind CSS, Leaflet, `globe.gl` (and underlying three.js ecosystem dependencies)
- **Backend:** ASP.NET Core (.NET 10)
- **Scientific engine:** Python, FastAPI, Uvicorn (and dependencies in `scientific-engine/requirements.txt`)
- **Dev/Infra:** Docker, Docker Compose, Git, Node.js/npm
- **3D/texture assets currently referenced in code:** procedural/generated planet textures (client-side) and selected remote equirectangular/visual assets (e.g. threex.planets Mars map, three-globe example Earth textures) as implemented; verify licenses/attribution for all third-party assets included in the final submission.

### Open-Source / Licensing & Permissions
- `[TEAM TO COMPLETE]` Confirm licenses for all third-party code, data, imagery, fonts, and media used. Ensure you have permission for any copyrighted materials included in the submission and that links/assets are publicly accessible to judges.

---

## Submission Readiness Checklist (per Project Submission Guide)
- [ ] **Team:** All members registered/confirmed at the same Local Event (or Universal Event rules followed).
- [ ] **Challenge:** `[Specify selected NASA Space Apps 2026 challenge and ensure relevance is clear.]`
- [ ] **All required fields completed** on the Space Apps project page (in English).
- [ ] **Demo link:** public, no login/permissions; video ≤ 30s (English or subtitled in English) or slide deck ≤ 7 slides (English).
- [ ] **Final project link:** public, no login/permissions.
- [ ] **NASA Data:** at least one NASA data/resource clearly identified (NASA POWER used; add others if applicable).
- [ ] **SI disclosure:** clearly indicated where/how SI was used; watermarks/metadata/descriptive acknowledgments added as required; no NASA branding/design elements in generated content.
- [ ] **No content depicting persons under 18** in demo/final materials (per Terms & Conditions).
- [ ] **Content originality:** confirm all work is original/appropriately attributed; include references for third-party materials.
- [ ] **Submit before deadline:** click “Submit for Judging” before **Sunday, November 15, 11:59 p.m. (local event time)** / Universal Event owner’s local time as applicable. Save often; last saved submission is judged.
- [ ] **Optional:** request FortiGuard Web Filter Classification for newly created project website to reduce judge access issues.

---

## Appendix: Quick Technical Reference
- **Default local ports:** Frontend `4321`, Backend `5000`, Scientific engine `8001`
- **Main search path:** `POST /api/analogs/search` → `POST /search/analogs`
- **Result characteristics:** dynamic candidates, similarity components, georeferencing, aerial map with pin, advanced comparison fields, source/fallback notes
- **Known operational notes:** external data/tiles depend on network access; engine text/field updates require rebuild/restart for new searches; visual/interactive validation recommended in browser and Docker target environment.

---

*Prepared for NASA Space Apps Challenge 2026 submission requirements. Review all placeholders, verify factual accuracy (especially NASA/partner data and SI use), and ensure all linked materials are publicly accessible before submission.*
