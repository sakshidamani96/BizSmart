# BizSmart

**Retail & inventory management for Indian kirana / SME stores.** It covers POS billing, inventory with batches and expiry tracking, khata (customer credit), suppliers, expenses, staff accounts and an owner dashboard.

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Spring Boot 3.2 (Java 17), Spring Security + JWT, Spring Data JPA |
| Database | PostgreSQL on Render (H2 in-memory for local development) |
| Hosting | Render Blueprint: **one Docker web service** (UI + API) + **one managed Postgres** |

## Project structure

```
.
├── render.yaml          # Render Blueprint (web service + Postgres)
├── Dockerfile           # Builds the UI, bundles it into the Spring Boot jar, runs it
├── backend/             # Spring Boot API  (com.bizsmart.*)
│   └── src/main/resources/
│       ├── application.yml        # default (H2) + prod (Postgres) profiles
│       └── seed/products.json     # demo catalogue (30 products)
├── frontend/            # React app (src/App.jsx, src/api.js)
└── docs/                # Architecture, API reference, setup and deployment guides
```

## Deploy to Render (about 10 minutes)

See **[docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)**. In short:

1. Push this folder to your own GitHub repository (with `render.yaml` at the root).
2. In Render: **New → Blueprint →** select the repo **→ Apply**.
3. Open `https://<your-service>.onrender.com` and sign in (demo accounts below).

## Run locally

```bash
# Terminal 1: API on :8080 with an in-memory H2 database
cd backend && mvn spring-boot:run

# Terminal 2: UI on :5173, proxying /api to :8080
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

Leave `VITE_API_BASE_URL` empty to run the UI alone in **offline demo mode**, where all data stays in the browser.

## Demo accounts (seeded when `SEED_DEMO_DATA=true`)

| Portal | Email | Password |
|---|---|---|
| Store Owner | owner@bizsmart.in | `password123` (or `DEMO_USER_PASSWORD`) |
| Cashier / Employee | cashier@bizsmart.in | same |
| Supplier | supplier@itc.in | same |
| Platform Admin | admin@bizsmart.in | same |

New store owners can register from the landing page. Staff logins are created by the owner under **Employees**.

## Documentation

- [Deploying on Render](docs/DEPLOY_RENDER.md)
- [Local setup](docs/SETUP_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [REST API reference](docs/API.md)
- [Changelog: deployment hardening](docs/CHANGELOG.md)
