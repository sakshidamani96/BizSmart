# Architecture

```
Browser ──HTTPS──► Render web service "bizsmart" (Docker, :$PORT)
                    │  Spring Boot 3
                    │   ├─ /            → React SPA (static files bundled in the jar)
                    │   ├─ /assets/**   → hashed JS/CSS, cached 1 year
                    │   └─ /api/**      → REST controllers (JWT protected)
                    │
                    └──internal network──► Render PostgreSQL "bizsmart-db"
```

## Backend layers (`backend/src/main/java/com/bizsmart`)

| Package | Responsibility |
|---|---|
| `controllers` | REST endpoints, request validation, role checks (`@PreAuthorize`) |
| `services` | Business rules: stock locking, order state machine, khata, analytics |
| `repositories` | Spring Data JPA (portable JPQL, H2 and PostgreSQL) |
| `models` | JPA entities; tables are created or updated by Hibernate (`ddl-auto=update`) |
| `security` | Stateless JWT auth, `Roles` expressions, CORS |
| `exceptions` | `GlobalExceptionHandler`: one JSON error format for every failure |
| `config` | `DataSeeder` (idempotent demo data), `WebConfig` (static caching) |

## Roles

| Role | Can do |
|---|---|
| `BUSINESS_OWNER` / `ADMIN` / `PLATFORM_ADMIN` | Everything, including staff management, deletes and supplier payments |
| `MANAGER` | Products, suppliers, expenses, analytics |
| `EMPLOYEE` / `STAFF` | POS orders, customers, khata payments, stock adjustments |
| `SUPPLIER` | Signs in to the supplier portal (read-only UI) |

Public sign-up creates **store owners only**. Staff accounts are created by an owner (`POST /api/employees`).

## Key business rules

- **Stock integrity:** order creation locks each product row (`SELECT … FOR UPDATE`), so concurrent sales cannot oversell. Quantities must be ≥ 1.
- **Server-side pricing:** order totals are computed from the catalogue, and client-sent prices are ignored.
- **Order lifecycle:** PENDING → PROCESSING → SHIPPED → DELIVERED, and CANCELLED from any non-final state. Cancelling restores stock and reverses khata charges. DELIVERED and CANCELLED are final.
- **Khata:** CREDIT sales add to the customer's outstanding balance; `POST /api/customers/{id}/payments` records repayments.

## Frontend

`frontend/src/api.js` is the only place that talks to the server. It normalises backend entities to the UI's shapes. `App.jsx` holds the UI state:
- **Backend configured:** sign-in and registration are verified by the server, and sales, stock changes, products, customers, staff and khata payments are synced.
- **Offline demo mode** (no `VITE_API_BASE_URL`): all data lives in the browser.

## Demand forecast

`POST /api/analytics/forecast/{id}` uses a built-in heuristic. An external forecasting service can be plugged in later through `ML_SERVICE_URL`; it is not deployed by this Blueprint.
