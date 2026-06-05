# Inventory & Order Management System

A full-stack web application for managing products, customers, and orders — built as a technical assessment.

**Stack:** FastAPI · PostgreSQL · React · Tailwind CSS · Docker · Docker Compose

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                        │
│                                                             │
│  ┌────────────┐    HTTP     ┌─────────────┐   SQL   ┌────┐ │
│  │  Frontend  │ ──────────▶ │   Backend   │ ──────▶ │ DB │ │
│  │ React+Vite │            │   FastAPI   │         │ PG │ │
│  │  nginx:80  │            │   :8000     │         │    │ │
│  └────────────┘            └─────────────┘         └────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers (products, customers, orders, dashboard)
│   │   ├── core/               # Settings, config
│   │   ├── db/                 # SQLAlchemy session, Base
│   │   ├── models/             # ORM models
│   │   ├── schemas/            # Pydantic request/response models
│   │   └── services/           # Business logic layer
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Pytest test suite
│   ├── main.py                 # FastAPI app factory
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/         # Feature-organised React components
│   │   ├── services/           # Axios API client + resource helpers
│   │   └── main.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Database Schema

```sql
products        customers       orders          order_items
──────────      ──────────      ──────────      ───────────
id (PK)         id (PK)         id (PK)         id (PK)
name            full_name       customer_id FK  order_id FK
sku (UNIQUE)    email (UNIQUE)  status          product_id FK
price           phone_number    total_amount    quantity
quantity ≥ 0    created_at      created_at      unit_price
created_at      updated_at      updated_at
updated_at
```

---

## Getting Started

### Prerequisites

- Docker ≥ 24 and Docker Compose ≥ 2
- Git

### 1. Clone

```bash
git clone https://github.com/your-username/inventory-system.git
cd inventory-system
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and any other values
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost             |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| Health   | http://localhost:8000/health |

### 4. Stop

```bash
docker compose down          # keep data
docker compose down -v       # also remove postgres volume
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set env vars
export DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_db"
export ALLOWED_ORIGINS="http://localhost:3000"

# Run migrations
alembic upgrade head

# Start dev server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Set env vars
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

npm run dev      # starts at http://localhost:3000
```

### Run Tests

```bash
cd backend
pytest tests/ -v
```

---

## API Reference

### Products

| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| GET    | /api/v1/products/   | List all products     |
| POST   | /api/v1/products/   | Create product        |
| GET    | /api/v1/products/{id} | Get product by ID   |
| PUT    | /api/v1/products/{id} | Update product      |
| DELETE | /api/v1/products/{id} | Delete product      |

### Customers

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/v1/customers/    | List all customers   |
| POST   | /api/v1/customers/    | Create customer      |
| GET    | /api/v1/customers/{id} | Get customer by ID  |
| DELETE | /api/v1/customers/{id} | Delete customer     |

### Orders

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/v1/orders/    | List all orders          |
| POST   | /api/v1/orders/    | Create order             |
| GET    | /api/v1/orders/{id} | Get order with details  |
| DELETE | /api/v1/orders/{id} | Cancel order            |

### Dashboard

| Method | Endpoint                 | Description         |
|--------|--------------------------|---------------------|
| GET    | /api/v1/dashboard/stats  | Aggregate stats     |

### Example: Create Order

```json
POST /api/v1/orders/
{
  "customer_id": 1,
  "items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}

// Response 201
{
  "id": 42,
  "customer_id": 1,
  "customer_name": "Jane Doe",
  "status": "confirmed",
  "total_amount": "149.97",
  "items": [...],
  "created_at": "2024-06-01T10:00:00Z",
  "updated_at": "2024-06-01T10:00:00Z"
}
```

---

## Business Rules

- SKU must be unique per product.
- Customer email must be unique.
- Product `quantity_in_stock` cannot go below 0 (enforced at DB and service layer).
- Orders cannot be placed if any item has insufficient stock.
- Creating an order **automatically deducts** stock for each item.
- Cancelling an order **automatically restores** stock.
- `total_amount` is **always calculated on the backend** — never trusted from the client.
- All prices are snapshotted at `unit_price` per order item at time of order.

---

## Deployment

### Backend → Render

1. Push to GitHub.
2. Create a **New Web Service** on [render.com](https://render.com).
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add a **PostgreSQL** service on Render; copy the **Internal Database URL**.
5. Set environment variables:

   | Key               | Value                            |
   |-------------------|----------------------------------|
   | `DATABASE_URL`    | (from Render PostgreSQL)         |
   | `ALLOWED_ORIGINS` | https://your-frontend.vercel.app |
   | `ENVIRONMENT`     | production                       |
   | `DEBUG`           | false                            |

6. Run migrations after first deploy:
   ```bash
   # In Render Shell
   alembic upgrade head
   ```

### Frontend → Vercel

1. Import the repository into [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add environment variable:

   | Key            | Value                          |
   |----------------|--------------------------------|
   | `VITE_API_URL` | https://your-backend.render.com |

6. Deploy — Vercel will auto-deploy on every push to `main`.

### CORS

After deploying, update your Render backend env var:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```
Then redeploy the backend service.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Service layer separates business logic from routes | Routes stay thin; logic is testable in isolation |
| `unit_price` snapshotted on `OrderItem` | Order totals are immutable even if product price changes later |
| Stock deduction inside a single DB transaction | Prevents partial failures and race conditions |
| Alembic migrations separate from `create_all` | Production-safe schema evolution |
| Multi-stage Docker builds | Minimal image size; build tools not in runtime image |
| `CheckConstraint` on quantity and price | Last line of defence at DB level |

---

## License

MIT