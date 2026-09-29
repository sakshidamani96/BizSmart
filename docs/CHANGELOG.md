# Changelog: Render deployment hardening

## Deployment blockers fixed
- The backend did not compile: `WebSecurityConfig.filterChain` returned `http` instead of `http.build()`.
- Startup crashed on JPQL that used alias getters (`stockQuantity`, `safetyStock`) instead of the real fields, and on enum-to-string comparisons.
- Render's `postgresql://` connection string is not a JDBC URL. The `prod` profile now builds the JDBC URL from Render's separate DB host, port, name, user and password values.
- `render.yaml` was in a nested folder, so Render never detected it. It is now at the repo root (with `runtime: docker`, since `env:` is deprecated), and the Postgres database is created in the same region.
- The frontend source (`frontend/src`) was missing from the archive and was restored from the project's Git origin.
- The spring-security matcher error caused by H2's extra servlet is avoided with explicit Ant matchers.

## Security
- `/api/**` requires a JWT; orders, customers and analytics were public before.
- Role checks moved to one shared `Roles` class: owner, management and staff.
- Public signup can no longer self-assign ADMIN; it creates store owners only and can be disabled. Staff are created by owners.
- Password hashes are never serialised (`/api/employees` leaked them before).
- JWT: minimum key length is enforced and the signature is always verified (`parseClaimsJws`).
- The H2 console is disabled in production, CORS origins are configurable, and health output no longer leaks database error text.
- Frontend: when a backend is configured, the server decides who is signed in. The local role guessing ("any email containing *admin*") is gone, and staff passwords are no longer stored in localStorage.

## Correctness
- Stock deduction locks the product row; duplicate lines are merged; quantities must be ≥ 1 (negative quantities used to *add* stock).
- Order status now follows a proper lifecycle (a cancelled order could previously be reopened without deducting stock again).
- The product API accepts the frontend's field names; every product sync used to fail validation.
- The customer email check no longer rejects every customer that has no email.
- Clients can no longer set balances or ids through request bodies (DTOs instead of raw entities).
- Seeding is idempotent, all roles are ensured (signup used to crash on a missing `ROLE_STAFF`), and backend and frontend share one 30-product catalogue.

## New features
- Expenses API (CRUD and per-category summary), categories API, khata repayments, supplier payments and edits, expiring-products endpoint, staff deactivation, `/api/auth/me`.
- The dashboard is computed from real orders instead of hard-coded numbers. It adds today's and this month's revenue, expenses, net profit, inventory value, khata outstanding, supplier dues, top sellers and a 7-day trend.
- A consistent JSON error format for every failure.

## Operations
- Single-container build: the React UI is bundled into the Spring Boot jar, giving one URL with no CORS setup.
- The JVM is tuned for 512 MB free instances; graceful shutdown; gzip compression; hashed assets cached for a year.
- Vite dev proxy for local full-stack development.

## Removed
- `frontend/node_modules`, `frontend/dist` (build outputs)
- `frontend/.vercel`, `frontend/vercel.json` (Vercel-specific)
- `backend/render.yaml`, `backend/Dockerfile` (duplicates of the root files)
- `database/schema.sql` (MySQL-style DDL with different roles and seed data from the app; the schema is now managed by JPA)
- The nested `BizSmart/BizSmart` folder and the `.git` folder whose remote pointed to another account
