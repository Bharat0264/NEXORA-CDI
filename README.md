# NEXORA-CDI

Evidence-Calibrated Causal Decision Intelligence for Business Analytics.

## Local setup

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start PostgreSQL (optional for health checks): `docker compose up -d postgres`.
3. Backend:
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --port 8000`
4. Frontend (separate terminal):
   - `cd frontend`
   - `npm install`
   - `npm run dev`

The frontend runs at `http://localhost:3000`; backend health is available at `http://localhost:8000/api/health`.

## Phase 2 data foundation

Upload CSV or XLSX files from the Data page. Original files are stored locally in `storage/`; metadata and computed profiles are stored in PostgreSQL. The Analytics page provides descriptive aggregations and correlation display only; it makes no causal claims.

## Phase 3 ML intelligence

ML Lab runs seeded sklearn pipelines with train/test separation and persists computed run metadata, metrics, and serialized model artifacts. Supported models are linear/logistic regression, random forest, K-Means, and Isolation Forest; forecasting currently uses the regression baseline pipeline.

## Phase 4 causal analysis

The causal endpoint implements DAG-validated linear regression adjustment for binary or continuous treatments, reporting its identification assumptions, interval, p-value, and a non-causal raw-association diagnostic. DoWhy and EconML are declared optional advanced estimators; unavailable or unsuitable estimators are not substituted with fabricated effects. Intervention scenarios are explicitly labelled model-based causal estimates.

## Validation

- Backend: `cd backend; python -c "from app.main import app; print(app.title)"`
- Frontend: `cd frontend; npm run typecheck` and `npm run lint`

## Schema migrations

From `backend/`: `alembic upgrade head`; `alembic downgrade -1`; `alembic revision --autogenerate -m "description"`.
