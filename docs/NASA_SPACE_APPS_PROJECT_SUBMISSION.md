# NASA Space Apps Challenge 2026 — Project Submission Documentation

**Project:** Itzamná (*Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas*)  
**Document purpose:** Complete, submission-ready documentation aligned with the NASA Space Apps Challenge 2026 Project Submission Guide. Replace all bracketed placeholders before submission and verify factual accuracy (especially NASA/partner data, SI disclosures, licenses, and public links).

---

## 1. Project Name
**Itzamná** — Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas

## 2. High-Level Project Summary
Itzamná is a web platform that identifies and compares **terrestrial locations analogous to lunar and Martian environments**. Users select a target body (Moon or Mars), choose a point and search radius on Earth, and optionally set environmental/terrain criteria. The system **dynamically computes candidate analog sites** (not from a predefined catalog) and returns each candidate with a similarity score, component-based methodology, georeferencing, accessibility and human-interference context, and general/advanced scientific comparison fields.

The explorer provides interactive 3D globes (Earth, Moon, Mars), a map-based location picker, and aerial/satellite result previews with pins at identified coordinates. When external data sources are unavailable or rate-limited, the scientific engine applies calculated/local fallback values and explicitly labels source/fallback notes to keep results transparent and usable for analog-site exploration, education, and mission-planning support.

## 3. Link to Project Demo
`[REQUIRED — insert publicly accessible URL (no login, permissions, or registration)]`

- **Format (choose one):** 30-second (or less) video demo, **or** slide deck of up to 7 slides (including title and introductory slides).
- **Language:** English required for slides and submission content. Video may be in another language only if it includes **English subtitles**.
- **Hosting:** External/public platform (e.g., YouTube, Google Drive, GitHub, OneDrive, Dropbox). Test the link in a private/incognito browser before submission.
- **Suggested 30s flow:** intro/team → challenge/problem → how Itzamná works (planet + location/radius + dynamic search) → NASA/open data use → impact/future potential.

## 4. Link to Final Project
`[REQUIRED — insert publicly accessible URL (no login, permissions, or registration)]`

- Provide access to the final project (e.g., public GitHub repository and/or deployed web app).
- Ensure all linked assets (code, docs, demo, data references) are publicly accessible to judges.
- **Local repository path:** `/home/jax/Documents/Files/Personal/Hackathon/Itzamna` (publish publicly and paste the final URL here).

## 5. Detailed Project Description

### 5.1 What the Project Does
Itzamná enables **dynamic, georeferenced discovery of Earth analogs** for Moon and Mars environments:
- **Target selection:** Moon or Mars.
- **Search inputs:** characteristic filters (Earth/zone criteria), selected Earth coordinates, search radius, and optional user-location/preferences (e.g., isolation/accessibility).
- **Dynamic candidate generation:** computes candidate sites on demand (no fixed catalog).
- **Results per candidate:**
  - Similarity percentage and **component-based scoring/methodology** (e.g., target zone, climate, elevation/DEM, substrate/moisture, spatial, accessibility, OSM/human-interference factors as applicable).
  - **Georeferencing** and derived location context.
  - Environmental/terrain context (climate indicators, elevation, edaphic/substrate, moisture-related fields where available).
  - Accessibility and human-interference context (including routing/OSM-derived signals when available).
  - **Aerial/satellite map preview with pin** at the identified Earth coordinates.
  - General and advanced comparison views (Earth vs Moon/Mars) with source/fallback notes.
- **Exports:** CSV and PDF result exports.
- **Safety notice:** on-entry/session-based private-property and safety notice.

### 5.2 How It Works
**System architecture (3-tier):**
1. **Frontend** — `frontend/` (Astro, TypeScript, Tailwind CSS, Leaflet, `globe.gl`)
   - Explorer UI, interactive 3D planetary globes, Leaflet map selection, results visualization, and exports.
   - Sends requests to the backend via `PUBLIC_API_URL`.
2. **Backend API / Gateway** — `backend/` (ASP.NET Core Web API, .NET 10, hexagonal structure)
   - Projects: `Itzamna.API`, `Itzamna.Application`, `Itzamna.Domain`, `Itzamna.Infrastructure`.
   - Validates/proxies search requests and exposes health endpoints.
3. **Scientific Engine** — `scientific-engine/` (Python, FastAPI)
   - Computes candidates and similarity components/scores, enriches with external providers, and applies calculated/local fallbacks with explicit source notes.

**Request flow:** Browser → `POST /api/analogs/search` (Backend) → `POST /search/analogs` (Scientific Engine) → scored candidates → frontend rendering.

**API endpoints**
- **Backend:** `GET /api/health`, `GET /api/health/scientific-engine`, `POST /api/analogs/search`
- **Scientific engine:** `GET /health`, `POST /search/analogs`

### 5.3 Benefits
- **Explainable analog selection:** component-based similarity and visible methodology/source notes.
- **Robustness:** fallback calculations maintain functionality when external APIs are unavailable or rate-limited.
- **Geospatial clarity:** 3D globes and pinned aerial previews connect planetary targets to real Earth locations.
- **Practical context:** includes accessibility, human-interference, and safety-awareness cues relevant to field/planning considerations.
- **Extensibility:** modular architecture supports adding richer datasets, models, and validation workflows.

### 5.4 Intended Impact and Future Goals
- Support researchers, educators, and mission planners in identifying and comparing Earth analog sites for lunar/Martian scenarios.
- Improve transparency and reproducibility of analog-site selection.
- Expand with additional planetary datasets, higher-fidelity environmental models, and field-validation integration.

### 5.5 Tools, Languages, Hardware, and Software
- **Frontend:** Astro, TypeScript, Tailwind CSS, Leaflet, `globe.gl`, Vite
- **Backend:** C#, ASP.NET Core Web API (.NET 10)
- **Scientific engine:** Python 3.12+, FastAPI, Uvicorn
- **Infrastructure/DevOps:** Docker, Docker Compose, Git
- **Runtime data/services:** NASA POWER API, OpenTopoData, ISRIC SoilGrids, OpenStreetMap/Nominatim, Overpass API, OSRM, Esri map/imagery services (see Sections 7–8)
- **Hardware:** No specialized hardware required; standard computer, modern browser, and internet access recommended (fallbacks used where implemented).

### 5.6 Repository Structure
```text
Itzamna/
├── frontend/                 # Web UI, explorer, 3D globes, maps, scripts, styles
├── backend/                  # .NET API gateway + hexagonal layers + tests
│   ├── src/Itzamna.API/
│   ├── src/Itzamna.Application/
│   ├── src/Itzamna.Domain/
│   └── src/Itzamna.Infrastructure/
├── scientific-engine/        # FastAPI search/scoring/providers/schemas
├── docs/                     # Documentation
├── docker-compose.yml
└── README.md
```

### 5.7 How to Run
**Docker Compose (recommended):**
```bash
docker compose up --build
```
- Frontend: `http://localhost:4321`
- Backend: `http://localhost:5000`
- Scientific engine: `http://localhost:8001`

**Notes:** For LAN access, set frontend `PUBLIC_API_URL` to `http://<HOST_IP>:5000` and rebuild. Rebuild/restart the scientific engine after code changes to return updated result text/fields. External tiles/APIs require network access; fallback values are used when available.

## 6. Use of Super Intelligence (SI)
**Did you utilize any Super Intelligence (SI) tools and software in preparing your solution?**  
`[TEAM TO CONFIRM AND COMPLETE — required disclosure]`

- **Challenge ideation/solution concept:** `[State explicitly whether SI was or was not used. SI must not be used to generate the idea of how to solve the challenge.]`
- **SI tools used (if any):** `[List tools/models and purpose: coding assistance, text drafting, image/video/audio generation, data processing, etc.]`
- **Where SI was used:** `[Specify files, components, media, or sections affected.]`
- **Required labeling/metadata:**
  - SI-generated images/videos: visible watermark.
  - SI-generated audio/code/data: acknowledged in descriptive text and metadata.
  - No SI-generated content may use, contain, or modify NASA branding or design elements.
- **Documentation note:** Portions of this documentation may have been drafted/organized with AI assistance based on repository materials; the team must review, verify facts, and ensure all SI-generated elements in the final submission are properly disclosed and labeled.

## 7. NASA Data
`[REQUIRED for Global Award eligibility — confirm accuracy and completeness]`

**NASA data/resources used:**
1. **NASA POWER (Prediction Of Worldwide Energy Resources) — Climatology Point API**
   - **Endpoint:** `https://power.larc.nasa.gov/api/temporal/climatology/point`
   - **Parameters used (as implemented):** `T2M`, `T2M_MIN`, `T2M_MAX`, `PRECTOTCORR`, `RH2M`, `WS2M`, `ALLSKY_SFC_SW_DWN` (community `RE`, JSON).
   - **Purpose:** climatological/environmental characterization inputs for analog candidate evaluation and similarity context.
   - **Implementation:** `scientific-engine/app/services/providers.py` (`fetch_nasa_power`).
   - **Fallback behavior:** if unavailable/saturated, calculated/local estimates are used and noted in result/source fields.

**Additional NASA-related visualization assets (verify attribution):**
- Earth 3D globe visualization uses three-globe example textures (e.g., Blue Marble–style and topology/bump imagery) loaded from `unpkg.com/three-globe/example/img/...` in `frontend/src/scripts/explorer.ts`. These commonly derive from NASA imagery in public examples; confirm and cite exact provenance/attribution in final submission materials if required.

`[Add any other NASA datasets/tools/resources used (names, URLs/DOIs, and how used).]`

## 8. Space Agency Partner Data and Other References

### 8.1 Space Agency Partner Data
`[TEAM TO COMPLETE]`
- List any 2026 Space Apps Space Agency Partner datasets/resources used (agency, dataset/resource name, URL, and purpose). If none were used, state explicitly: “No Space Agency Partner datasets were used beyond the sources listed below.”

### 8.2 Other External Data Sources & APIs
- **OpenTopoData** — `https://api.opentopodata.org` (elevation; e.g., SRTM/ASTER queries as implemented; fallback on failure).
- **ISRIC SoilGrids v2.0** — `https://rest.isric.org/soilgrids/v2.0/properties/query` (soil properties for substrate context; fallback on failure).
- **OpenStreetMap / Nominatim** — `https://nominatim.openstreetmap.org` (reverse geocoding/place context).
- **Overpass API** — `https://overpass-api.de/api/interpreter` (mapped-feature/human-interference context; fallback heuristics).
- **OSRM** — `https://router.project-osrm.org` (routing/distance-time estimates when available).
- **Esri ArcGIS map/imagery services** (via Leaflet): e.g., `World_Imagery`, `World_Boundaries_and_Places` for selection and result map previews.

### 8.3 Libraries, Frameworks, and Assets
- **Frontend:** Astro, TypeScript, Tailwind CSS, Leaflet, `globe.gl` (and related WebGL/three.js dependencies).
- **Backend:** ASP.NET Core Web API (.NET 10).
- **Scientific engine:** Python, FastAPI, Uvicorn (see `scientific-engine/requirements.txt`).
- **Dev/Infra:** Docker, Docker Compose, Git, Node.js/npm.
- **Visual assets/textures in implementation:** client-generated procedural planet textures and selected remote textures/assets (e.g., Earth three-globe example textures; Mars equirectangular texture from `raw.githubusercontent.com/jeromeetienne/threex.planets/...` as implemented). Verify licenses and include attribution for all third-party assets used in the final submission.

### 8.4 Permissions and Licensing
`[TEAM TO COMPLETE]`
- Confirm licenses/permissions for all third-party code, data, imagery, fonts, and media. Ensure no copyrighted material is used without permission and that all referenced materials are accessible to judges.

## 9. Submission Readiness Checklist
- [ ] **Challenge:** `[Specify selected 2026 challenge]` and clearly address it in demo/summary.
- [ ] **Team eligibility:** all members confirmed in the same Local Event (or Universal Event rules satisfied).
- [ ] **Required fields complete (English):** name, summary, demo link, final project link, detailed description, SI use, NASA data, references.
- [ ] **Demo:** public link, no login; video ≤ 30s (English/subtitled) or ≤ 7 slides (English).
- [ ] **Final project:** public link, no login/permissions.
- [ ] **NASA data/resource:** at least one clearly identified (NASA POWER included; add others if applicable).
- [ ] **SI disclosure:** accurate, with required watermarks/metadata/descriptive acknowledgments; no NASA branding in generated content.
- [ ] **Content compliance:** no depictions of persons under 18; original work and proper attribution.
- [ ] **Submission:** click **“Submit for Judging”** before **Sunday, Nov 15, 11:59 p.m. local time** of your Local/Universal event context; last saved submission is judged.

## 10. Operational Notes (for reviewers)
- Default ports: Frontend `4321`, Backend `5000`, Scientific engine `8001`.
- Main flow: `POST /api/analogs/search` → `POST /search/analogs`.
- Outputs depend on selected inputs and external data availability; fallback/calculated values are labeled when used.
- Rebuild services after code changes; validate interactive behavior in browser/Docker environment.

---
*Prepared for NASA Space Apps Challenge 2026. Final responsibility for accuracy, disclosures, permissions, and public accessibility of all submission materials rests with the team.*
