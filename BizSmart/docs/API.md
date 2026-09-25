# REST API reference

Base URL: same origin as the UI (e.g. `https://bizsmart-xxxx.onrender.com`).
Every endpoint except `/api/auth/*` and `/api/health` needs the header `Authorization: Bearer <token>`.

**Errors** always use this shape:
```json
{ "timestamp": "...", "status": 409, "error": "Conflict", "message": "Insufficient inventory for 'Atta'...", "path": "/api/orders", "fieldErrors": { } }
```
Status codes: 400 validation, 401 not signed in / bad credentials, 403 role not allowed, 404 not found, 409 conflict (duplicate, not enough stock, invalid status change).

Role groups: **M** = management (owner, admin, manager), **O** = owner/admin, **S** = any store staff.

## Auth
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/signin` | public | `{ "username": "<email or username>", "password": "..." }` → `{ token, roles, ... }` |
| POST | `/api/auth/signup` | public* | `{ email, password, fullName, phone? }`. Creates a **store owner**. *Can be turned off with `PUBLIC_SIGNUP_ENABLED=false`. |
| GET | `/api/auth/me` | token | Current user |
| GET | `/api/health` | public | Service and database status |

## Products
| Method | Path | Access |
|---|---|---|
| GET | `/api/products?search=` | any signed-in user |
| GET | `/api/products/{id}` · `/low-stock` · `/expiring?days=30` | any signed-in user |
| POST | `/api/products` | M |
| PUT | `/api/products/{id}` | M |
| PATCH | `/api/products/{id}/stock?delta=-2` | S |
| DELETE | `/api/products/{id}` | O (409 if used in past orders) |

Product body (either naming style is accepted):
```json
{ "sku": "SKU-ATTA-101", "name": "Atta 10kg", "sellingPrice": 440, "purchasePrice": 385,
  "quantity": 35, "minStock": 15, "expiryDate": "2027-04-15",
  "categoryName": "Staples & Grains", "supplierName": "ITC Consumer Goods Distribution" }
```

## Orders (POS sales) — S
| Method | Path | Notes |
|---|---|---|
| GET | `/api/orders` · `/api/orders/{id}` · `/api/orders/customer/{customerId}` | |
| POST | `/api/orders` | `{ customerId?, paymentMode: "CASH"\|"UPI"\|"CREDIT", status?: "DELIVERED", billNo?, items: [{ productId, quantity }] }` |
| PATCH | `/api/orders/{id}/status?status=CANCELLED` | Follows the lifecycle; cancelling restores stock |

## Customers & khata — S
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/customers` | `{ name, phone?, email?, city?, creditLimit? }` |
| GET/PUT | `/api/customers/{id}` | |
| POST | `/api/customers/{id}/payments` | `{ amount, mode?, note? }`. Reduces the outstanding balance. |
| DELETE | `/api/customers/{id}` | O. Blocked while a balance is outstanding. |

## Suppliers & categories
| Method | Path | Access |
|---|---|---|
| GET | `/api/suppliers`, `/api/suppliers/{id}`, `/api/categories` | signed in |
| POST/PUT | `/api/suppliers`, `/api/suppliers/{id}`, `/api/categories` | M |
| POST | `/api/suppliers/{id}/payments` | O. Reduces pending dues. |
| DELETE | `/api/suppliers/{id}` | O |

## Expenses — M
| Method | Path | Notes |
|---|---|---|
| GET | `/api/expenses?from=2026-09-01&to=2026-09-30` | |
| GET | `/api/expenses/summary?from=&to=` | Totals by category |
| POST/PUT/DELETE | `/api/expenses`, `/api/expenses/{id}` | `{ title, category: RENT\|ELECTRICITY\|SALARY\|LOGISTICS\|PACKAGING\|MAINTENANCE\|MISC, amount, expenseDate?, notes? }` |

## Employees — O
| Method | Path | Notes |
|---|---|---|
| GET | `/api/employees` | Staff and managers |
| POST | `/api/employees` | `{ email, password, fullName, phone?, jobTitle?, roles?: ["MANAGER"] }` |
| PATCH | `/api/employees/{id}/status?active=false` | Deactivated users cannot sign in |

## Analytics — M
| Method | Path | Notes |
|---|---|---|
| GET | `/api/analytics/dashboard` | Revenue (today/month/all-time), month expenses and net profit, inventory value, khata outstanding, supplier dues, low-stock and expiring counts, 7-day sales trend, top 5 products (30 days), recent orders |
| POST | `/api/analytics/forecast/{productId}?discountPercent=&leadTimeDays=` | Heuristic reorder suggestion |
| GET | `/api/analytics/forecast/history/{productId}` · `/forecast/reorder-alerts` | |
