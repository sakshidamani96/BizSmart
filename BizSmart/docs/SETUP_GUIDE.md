# Local setup

## Prerequisites
- JDK 17+ and Maven 3.9+
- Node.js 18+ (20 recommended)
- Optional: Docker, to run the same image Render runs

## Option A: backend + frontend dev servers (recommended while coding)

```bash
cd backend
mvn spring-boot:run          # http://localhost:8080 (H2 in-memory, demo data seeded)
```

```bash
cd frontend
cp .env.example .env.local   # VITE_API_BASE_URL=/  -> Vite proxies /api to :8080
npm install
npm run dev                  # http://localhost:5173
```

H2 console: <http://localhost:8080/h2-console>. Use JDBC URL `jdbc:h2:mem:bizsmartdb`, user `sa`, and an empty password.

Windows users can use `backend/run_backend.bat` and `frontend/run_frontend.bat`.

## Option B: exactly what Render runs (Docker + Postgres)

```bash
docker network create bizsmart
docker run -d --name pg --network bizsmart -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bizsmartdb postgres:16
docker build -t bizsmart .
docker run --rm -p 8080:8080 --network bizsmart \
  -e SPRING_PROFILES_ACTIVE=prod -e DB_HOST=pg -e DB_NAME=bizsmartdb \
  -e DB_USER=postgres -e DB_PASSWORD=postgres \
  -e JWT_SECRET=local-docker-secret-at-least-32-bytes-long \
  bizsmart
# open http://localhost:8080
```

## Option C: frontend only (offline demo)

Leave `VITE_API_BASE_URL` empty. All data then lives in the browser and nothing is saved on a server.
