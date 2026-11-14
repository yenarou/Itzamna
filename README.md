# Itzamná

Itzamná (Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas) es una plataforma para identificar ubicaciones terrestres con características comparables a zonas de la Luna y Marte.

## Stack tecnológico

- Frontend: Astro + TypeScript + Tailwind CSS
- Backend: ASP.NET Core Web API (.NET 10) con arquitectura hexagonal
- Motor científico: FastAPI + Python
- Infraestructura: Docker + Docker Compose + Git

## Estructura del repositorio

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

## Requisitos

- Node.js 22+
- npm
- .NET 10 SDK
- Python 3.12+
- Docker + Docker Compose

## Ejecutar los servicios

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

### Motor científico (local)

```bash
cd scientific-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Con Docker Compose

```bash
docker compose up --build
```

## Endpoints de salud

- Frontend: http://localhost:4321
- Backend: http://localhost:5000/api/health
- Backend -> científico: http://localhost:5000/api/health/scientific-engine
- Científico: http://localhost:8001/health

## Nota

Esta etapa prepara la estructura inicial del proyecto, la configuración de entornos y la base de la comunicación HTTP entre el backend y el motor científico, sin implementar lógica de negocio ni servicios externos.
