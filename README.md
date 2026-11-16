# Itzamná

Itzamná (Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas) is a platform for identifying terrestrial locations with characteristics comparable to regions on the Moon and Mars.

## Technology Stack

- Frontend: Astro + TypeScript + Tailwind CSS
- Backend: ASP.NET Core Web API (.NET 10) con arquitectura hexagonal
- Scientific engine: FastAPI + Python
- Infraestructura: Docker + Docker Compose + Git

## Repository Structure

```text
Itzamna/
├── frontend/
├── backend/
│   ├── src/
│   │   ├── Itzamna.API/
│   │   ├── Itzamna.Application/
│   │   ├── Itzamna.Domain/
│   │   └── Itzamna.Infrastructure/
│   └── tests/
│       ├── Itzamna.UnitTests/
│       └── Itzamna.IntegrationTests/
├── scientific-engine/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   └── tests/
├── docs/
├── docker-compose.yml
├── .gitignore
├── README.md
└── .dockerignore
```

## Requirements

- Node.js 22+
- npm
- .NET 10 SDK
- Python 3.12+
- Docker + Docker Compose

## Run the Services

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

### Backend (local)

```bash
cd backend
dotnet restore
dotnet build Itzamna.slnx
dotnet run --project src/Itzamna.API/Itzamna.API.csproj
```

### Scientific Engine (Local)

```bash
cd scientific-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### With Docker Compose

```bash
docker compose up --build
```

## Health Endpoints

- Frontend: http://localhost:4321
- Backend: http://localhost:5000/api/health
- Backend -> scientific engine: http://localhost:5000/api/health/scientific-engine
- Scientific engine: http://localhost:8001/health

## Video Explication
-https://drive.google.com/drive/folders/1PiK6KPID32nC5XsmhfOkhlHctPeakaiA?usp=drive_link

## Note

This stage establishes the project structure, environment configuration, and HTTP communication between the backend and scientific engine. It does not implement business logic or external services.
